import { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../lib/auth-context";
import { deleteMyAccount } from "../lib/account-deletion";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [pushOrder, setPushOrder] = useState(true);
  const [pushDeals, setPushDeals] = useState(true);
  const [pushNews, setPushNews] = useState(false);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const comingSoon = (feature: string) =>
    Alert.alert(`${feature}`, "Coming soon — we're working on this.");

  const openTerms = () => WebBrowser.openBrowserAsync("https://kafudeal.com/terms.html");
  const openPrivacy = () => WebBrowser.openBrowserAsync("https://kafudeal.com/privacy.html");

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account, profile, cart, saved items, and notifications. Past orders will be kept in our records for legal and accounting purposes but will no longer be linked to your account.\n\nThis cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Second confirmation to prevent accidental deletion
            Alert.alert(
              "Final confirmation",
              "Type-confirm not required, but this is your last chance. Delete account?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, delete forever",
                  style: "destructive",
                  onPress: async () => {
                    setDeleting(true);
                    const { error } = await deleteMyAccount();
                    setDeleting(false);
                    if (error) {
                      Alert.alert(
                        "Couldn't delete account",
                        `${error}\n\nIf this keeps happening, email support@kafudeal.com and we'll process the deletion manually.`
                      );
                      return;
                    }
                    Alert.alert(
                      "Account deleted",
                      "Your account and all associated data have been deleted. Sorry to see you go 👋",
                      [
                        {
                          text: "OK",
                          onPress: async () => {
                            await signOut();
                            router.replace("/(tabs)");
                          },
                        },
                      ]
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.topTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Account */}
        <Text style={s.section}>ACCOUNT</Text>
        <View style={s.group}>
          <Row icon="person-outline" label="Personal info" onPress={() => comingSoon("Personal info")} />
          <Row icon="lock-closed-outline" label="Password & security" onPress={() => comingSoon("Password & security")} />
          <Row
            icon="finger-print-outline"
            label="Use biometric login"
            toggle
            value={biometric}
            onChange={setBiometric}
            last
          />
        </View>

        {/* Notifications */}
        <Text style={s.section}>NOTIFICATIONS</Text>
        <View style={s.group}>
          <Row icon="cube-outline" label="Order updates" toggle value={pushOrder} onChange={setPushOrder} />
          <Row icon="flame-outline" label="Flash deals & offers" toggle value={pushDeals} onChange={setPushDeals} />
          <Row icon="newspaper-outline" label="News & tips" toggle value={pushNews} onChange={setPushNews} last />
        </View>

        <Text style={s.section}>EMAIL & SMS</Text>
        <View style={s.group}>
          <Row icon="mail-outline" label="Email updates" toggle value={email} onChange={setEmail} />
          <Row icon="chatbubble-outline" label="SMS updates" toggle value={sms} onChange={setSms} last />
        </View>

        {/* Preferences */}
        <Text style={s.section}>PREFERENCES</Text>
        <View style={s.group}>
          <Row icon="language-outline" label="Language" value2="English" onPress={() => comingSoon("Language")} />
          <Row icon="cash-outline" label="Currency" value2="AED" onPress={() => comingSoon("Currency")} />
          <Row icon="moon-outline" label="Theme" value2="Light" onPress={() => comingSoon("Theme")} last />
        </View>

        {/* Legal */}
        <Text style={s.section}>LEGAL</Text>
        <View style={s.group}>
          <Row icon="document-text-outline" label="Terms of service" onPress={openTerms} />
          <Row icon="shield-outline" label="Privacy policy" onPress={openPrivacy} />
          <Row
            icon="information-circle-outline"
            label="About KafuDeal"
            value2="v0.11.0"
            onPress={() =>
              Alert.alert(
                "About KafuDeal",
                "KafuDeal v0.11.0\nMade with 💛 in the UAE\n\nWe rescue near-expiry groceries from waste and pass the savings to you."
              )
            }
            last
          />
        </View>

        {user && (
          <>
            <Pressable onPress={handleSignOut} style={s.signoutBtn} disabled={deleting}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={s.signoutText}>Sign out</Text>
            </Pressable>

            {/* Account deletion required by Apple App Store guideline 5.1.1(v) */}
            <Pressable
              onPress={handleDeleteAccount}
              style={s.deleteBtn}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#DC2626" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text style={s.deleteText}>Delete my account</Text>
                </>
              )}
            </Pressable>
            <Text style={s.deleteHelp}>
              Permanently removes your account and personal data. Past orders are
              anonymized for legal record-keeping. Cannot be undone.
            </Text>
          </>
        )}

        <Text style={s.footer}>Made with 💛 in the UAE</Text>
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  toggle,
  value,
  onChange,
  value2,
  last,
  onPress,
}: {
  icon: any;
  label: string;
  toggle?: boolean;
  value?: boolean;
  onChange?: (v: boolean) => void;
  value2?: string;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[s.row, !last && s.rowBorder]}>
      <Ionicons name={icon} size={20} color="#64748B" style={{ marginRight: 14 }} />
      <Text style={s.rowLabel}>{label}</Text>
      {toggle ? (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: "#CBD5E1", true: "#FFC4A0" }}
          thumbColor={value ? "#FF6B2C" : "#F1F5F9"}
        />
      ) : value2 ? (
        <>
          <Text style={s.rowValue}>{value2}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      )}
    </Pressable>
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
  section: { fontSize: 10.5, fontWeight: "800", color: "#94A3B8", letterSpacing: 1, marginTop: 22, marginBottom: 10, paddingHorizontal: 20 },
  group: { backgroundColor: "white", marginHorizontal: 16, borderRadius: 14, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)" },
  rowLabel: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "600" },
  rowValue: { fontSize: 13, color: "#64748B", marginRight: 6 },
  signoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 16, marginTop: 24, padding: 14,
    backgroundColor: "white", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(220,38,38,0.20)",
  },
  signoutText: { color: "#DC2626", fontSize: 14, fontWeight: "800" },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 16, marginTop: 12, padding: 14,
    backgroundColor: "#FEE2E2", borderRadius: 12,
  },
  deleteText: { color: "#DC2626", fontSize: 14, fontWeight: "800" },
  deleteHelp: {
    fontSize: 11, color: "#94A3B8", textAlign: "center",
    paddingHorizontal: 32, marginTop: 8, lineHeight: 16,
  },
  footer: { textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 24 },
});
