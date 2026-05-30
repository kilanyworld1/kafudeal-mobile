import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { addressesAPI } from "../lib/api";

type Address = {
  id: string;
  label: string;
  address_line: string;
  city?: string | null;
  emirate?: string | null;
  phone?: string | null;
  is_default?: boolean | null;
};

// Map UAE address label to a sensible icon
const iconFor = (label?: string): "home" | "briefcase" | "location" => {
  const l = (label || "").toLowerCase();
  if (l === "home") return "home";
  if (l === "work" || l === "office") return "briefcase";
  return "location";
};

export default function Addresses() {
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect: reload addresses every time the screen comes into focus.
  // That covers "user added a new address and tapped Back" — the new row
  // shows up without a manual refresh.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        const { data } = await addressesAPI.list();
        if (!alive) return;
        setAddresses((data || []) as Address[]);
        setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const handleDelete = (addr: Address) => {
    Alert.alert(
      "Delete address?",
      `Remove "${addr.label}" from your saved addresses?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await addressesAPI.remove(addr.id);
            if (error) {
              Alert.alert("Couldn't delete", typeof error === "string" ? error : "Try again.");
              return;
            }
            setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addr: Address) => {
    const { error } = await addressesAPI.setDefault(addr.id);
    if (error) {
      Alert.alert("Couldn't update", typeof error === "string" ? error : "Try again.");
      return;
    }
    // Optimistic update — flip is_default on the chosen row, off everywhere else
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === addr.id }))
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.topTitle}>Addresses</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color="#FF6B2C" />
          </View>
        ) : addresses.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="location-outline" size={36} color="#FF6B2C" />
            <Text style={s.emptyTitle}>No saved addresses yet</Text>
            <Text style={s.emptySub}>
              Add an address so we can deliver your orders here.
            </Text>
          </View>
        ) : (
          addresses.map((a) => (
            <View key={a.id} style={s.card}>
              <View style={s.cardHead}>
                <View style={s.iconWrap}>
                  <Ionicons name={iconFor(a.label)} size={20} color="#FF6B2C" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.labelRow}>
                    <Text style={s.label}>{a.label}</Text>
                    {a.is_default && (
                      <View style={s.defaultPill}>
                        <Text style={s.defaultPillText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.line}>{a.address_line}</Text>
                  {(a.city || a.emirate) ? (
                    <Text style={s.area}>
                      {[a.city, a.emirate].filter(Boolean).join(", ")}
                    </Text>
                  ) : null}
                  {a.phone ? <Text style={s.phone}>{a.phone}</Text> : null}
                </View>
              </View>

              <View style={s.cardActions}>
                {!a.is_default && (
                  <Pressable onPress={() => handleSetDefault(a)} style={s.actionBtn}>
                    <Ionicons name="star-outline" size={16} color="#0F172A" />
                    <Text style={s.actionText}>Set default</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => handleDelete(a)} style={s.actionBtn}>
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={[s.actionText, { color: "#DC2626" }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Pressable
          onPress={() => router.push("/add-address")}
          style={s.addBtn}
        >
          <Ionicons name="add-circle" size={20} color="#FF6B2C" />
          <Text style={s.addBtnText}>Add new address</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F2" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: "white",
    borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)",
  },
  iconBtn: { padding: 6 },
  topTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  loadingBox: {
    paddingVertical: 40, alignItems: "center", justifyContent: "center",
  },
  emptyBox: {
    backgroundColor: "white", borderRadius: 14,
    paddingVertical: 32, paddingHorizontal: 20,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,107,44,0.30)",
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A", marginTop: 10 },
  emptySub: {
    fontSize: 13, color: "#64748B", marginTop: 4, textAlign: "center",
    maxWidth: 240,
  },
  card: {
    backgroundColor: "white", borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: "#0F172A", shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardHead: { flexDirection: "row" },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#FFE7D1",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  defaultPill: { backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  defaultPillText: { color: "#166534", fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  line: { fontSize: 13, color: "#334155", marginTop: 4 },
  area: { fontSize: 12, color: "#64748B", marginTop: 2 },
  phone: { fontSize: 12, color: "#64748B", marginTop: 2 },
  cardActions: {
    flexDirection: "row", gap: 8, marginTop: 14,
    paddingTop: 14, borderTopWidth: 0.5, borderTopColor: "rgba(15,23,42,0.06)",
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: "#F1EFE8", borderRadius: 999,
  },
  actionText: { fontSize: 12, fontWeight: "700", color: "#0F172A" },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "white",
    borderRadius: 14, paddingVertical: 16,
    borderWidth: 1.5, borderColor: "rgba(255,107,44,0.40)",
    borderStyle: "dashed",
  },
  addBtnText: { color: "#FF6B2C", fontSize: 14, fontWeight: "800" },
});
