import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

const addresses = [
  {
    id: "a1", label: "Home", line: "Marina Towers, Tower 3, Apt 1402",
    area: "Dubai Marina · JLT", phone: "+971 50 123 4567", default: true, icon: "home" as const,
  },
  {
    id: "a2", label: "Work", line: "Boulevard Plaza, Office 22, Floor 18",
    area: "Downtown Dubai", phone: "+971 50 123 4567", default: false, icon: "briefcase" as const,
  },
];

export default function Addresses() {
  const insets = useSafeAreaInsets();

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
        {addresses.map((a) => (
          <View key={a.id} style={s.card}>
            <View style={s.cardHead}>
              <View style={s.iconWrap}>
                <Ionicons name={a.icon} size={20} color="#FF6B2C" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.labelRow}>
                  <Text style={s.label}>{a.label}</Text>
                  {a.default && (
                    <View style={s.defaultPill}>
                      <Text style={s.defaultPillText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Text style={s.line}>{a.line}</Text>
                <Text style={s.area}>{a.area}</Text>
                <Text style={s.phone}>{a.phone}</Text>
              </View>
            </View>

            <View style={s.cardActions}>
              <Pressable style={s.actionBtn}>
                <Ionicons name="create-outline" size={16} color="#0F172A" />
                <Text style={s.actionText}>Edit</Text>
              </Pressable>
              {!a.default && (
                <Pressable style={s.actionBtn}>
                  <Ionicons name="star-outline" size={16} color="#0F172A" />
                  <Text style={s.actionText}>Set default</Text>
                </Pressable>
              )}
              <Pressable style={s.actionBtn}>
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                <Text style={[s.actionText, { color: "#DC2626" }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}

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
