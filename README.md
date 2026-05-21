# KafuDeal Mobile · v0.1.0 (static UI preview)

Expo (React Native) app that mirrors the v8 prototype. Static UI for now — connects to Supabase next round.

## Run it on your phone in 5 minutes

### 1. Install Node.js (if you don't have it)
Download from [nodejs.org](https://nodejs.org) → **LTS version**. Run the installer.

### 2. Install Expo Go on your phone
- **iOS**: search "Expo Go" on the App Store → install
- **Android**: search "Expo Go" on Google Play → install

### 3. From your computer
Open Terminal (Mac) / PowerShell (Windows), `cd` into this folder, and run:

```bash
npm install
npx expo start
```

After it boots, you'll see a QR code in the terminal.

### 4. Scan the QR code
- **iOS**: open the Camera app and point at the QR code → tap the notification → opens in Expo Go
- **Android**: open Expo Go → tap "Scan QR code"

The app loads on your phone with hot reload — edit a file, see it instantly.

---

## What's in this build

| Screen | File | Status |
| --- | --- | --- |
| Splash (orange, animated) | `app/index.tsx` | ✅ Done |
| Home (banner + categories + product grid) | `app/(tabs)/index.tsx` | ✅ Done |
| Deals list | `app/(tabs)/deals.tsx` | ✅ Done |
| Cart | `app/(tabs)/cart.tsx` | ✅ Done |
| Orders | `app/(tabs)/orders.tsx` | ✅ Done |
| Account | `app/(tabs)/account.tsx` | ✅ Done |
| Product detail | `app/product/[id].tsx` | ✅ Done |

Tap a product card on Home or Deals → navigates to the detail screen.

## Stack

- **Expo SDK 52** with React Native 0.76 (new architecture)
- **Expo Router** (file-based navigation)
- **NativeWind v4** (Tailwind utility classes in RN)
- **Reanimated 3** (splash animations)
- **expo-linear-gradient** for the brand orange gradients
- **expo-router** + tabs for bottom nav

## Brand colors

| Token | Hex | Use |
| --- | --- | --- |
| `kafu-orange` | `#FF6B2C` | Primary CTA, banner |
| `kafu-orange-2` | `#FF8C3A` | Banner gradient stop |
| `kafu-amber` | `#FFC857` | Accent, notification dot |
| `kafu-navy` | `#0B1020` | Brand "Deal" text on splash |
| `kafu-cream` | `#FFF9F2` | App background |

## Next milestones

1. **Connect to Supabase** — replace `data/products.ts` with live RPC calls
2. **Auth** — Supabase Auth + Apple/Google Sign-in via Expo
3. **Push notifications** — Expo Push for order status updates
4. **Build for App Store + Google Play** — `eas build` (~30 min)

---

## Troubleshooting

**"Cannot find module"** errors after install → run `npx expo doctor` then `npm install` again.

**Phone shows blank white screen** → kill the dev server (`Ctrl+C`), make sure your phone and computer are on the same Wi-Fi, then `npx expo start --clear`.

**Tunnel mode (if Wi-Fi is restricted)** → `npx expo start --tunnel`.
