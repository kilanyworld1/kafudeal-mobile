import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

const labels = ["Home", "Work", "Other"];

export default function AddAddress() {
  const insets = useSafeAreaInsets();
  const [label, setLabel] = useState("Home");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [building, setBuilding] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Dubai");
  const [notes, setNotes] = useState("");
  const [setDefault, setSetDefault] = useState(false);

  const canSave = building.length > 0 && area.length > 0 && phone.length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.root}>
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={s.iconBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={s.topTitle}>New address</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
          {/* Map preview */}
          <View style={s.mapPreview}>
            <Ionicons name="map" size={48} color="#FF6B2C" />
            <Text style={s.mapText}>Tap to set pin on map</Text>
          </View>

          {/* Label tabs */}
          <Text style={s.label}>Label</Text>
          <View style={s.tabRow}>
            {labels.map((l) => (
              <Pressable
                key={l}
                onPress={() => setLabel(l)}
                style={[s.tab, label === l && s.tabActive]}
              >
                <Ionicons
                  name={l === "Home" ? "home" : l === "Work" ? "briefcase" : "location"}
                  size={14}
                  color={label === l ? "#FF6B2C" : "#64748B"}
                />
                <Text style={[s.tabText, label === l && s.tabTextActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>Full name</Text>
          <TextInput
            value={name} onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>Phone</Text>
          <TextInput
            value={phone} onChangeText={setPhone}
            placeholder="+971 50 000 0000"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            style={s.input}
          />

          <Text style={s.label}>Building / Apartment</Text>
          <TextInput
            value={building} onChangeText={setBuilding}
            placeholder="e.g. Marina Towers, Tower 3, Apt 1402"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>Street (optional)</Text>
          <TextInput
            value={street} onChangeText={setStreet}
            placeholder="e.g. Sheikh Zayed Rd"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>Area / Neighbourhood</Text>
          <TextInput
            value={area} onChangeText={setArea}
            placeholder="e.g. Dubai Marina"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>City</Text>
          <TextInput
            value={city} onChangeText={setCity}
            placeholder="Dubai"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />

          <Text style={s.label}>Delivery notes (optional)</Text>
          <TextInput
            value={notes} onChangeText={setNotes}
            placeholder="e.g. Leave at reception"
            placeholderTextColor="#94A3B8"
            multiline
            style={[s.input, { height: 80, textAlignVertical: "top", paddingTop: 12 }]}
          />

          <Pressable
            onPress={() => setSetDefault(!setDefault)}
            style={s.checkRow}
          >
            <View style={[s.check, setDefault && s.checkOn]}>
              {setDefault && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <Text style={s.checkText}>Set as default address</Text>
          </Pressable>
        </ScrollView>

        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={() => router.back()}
            style={[s.saveBtn, !canSave && { backgroundColor: "#FFD0B4" }]}
            disabled={!canSave}
          >
            <Text style={s.saveBtnText}>Save address</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  mapPreview: {
    height: 130, backgroundColor: "#F1EFE8",
    borderRadius: 14, alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(255,107,44,0.20)",
    borderStyle: "dashed",
  },
  mapText: { color: "#64748B", fontSize: 12, fontWeight: "700", marginTop: 6 },
  label: { fontSize: 12, fontWeight: "800", color: "#334155", marginBottom: 6, letterSpacing: 0.3, marginTop: 12 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
  },
  tabActive: { backgroundColor: "#FFE7D1", borderColor: "#FF6B2C" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#FF6B2C" },
  input: {
    backgroundColor: "white",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#0F172A",
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 },
  check: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: "#CBD5E1",
    alignItems: "center", justifyContent: "center",
  },
  checkOn: { backgroundColor: "#FF6B2C", borderColor: "#FF6B2C" },
  checkText: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16, backgroundColor: "white",
    borderTopWidth: 0.5, borderTopColor: "rgba(15,23,42,0.08)",
  },
  saveBtn: {
    backgroundColor: "#FF6B2C", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  saveBtnText: { color: "white", fontSize: 15, fontWeight: "800" },
});
