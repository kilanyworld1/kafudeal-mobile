import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  size?: number;
  variant?: "color" | "white"; // color = orange tag on cream; white = white tag on orange
};

export default function KafuMark({ size = 80, variant = "color" }: Props) {
  const tagFill = variant === "white" ? "#FFFFFF" : "url(#kfdGrad)";
  const handStroke = variant === "white" ? "#FF6B2C" : "#FF8C3A";

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="kfdGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor="#FFA45E" />
          <Stop offset="100%" stopColor="#FF8C3A" />
        </LinearGradient>
      </Defs>
      <Path
        d="M30 22 L75 22 Q85 22 85 32 L85 68 Q85 78 75 78 L30 78 L10 50 Z"
        fill={tagFill}
      />
      <Circle cx="38" cy="50" r="14" fill="#0B1020" />
      <Path d="M38 50 V40" stroke={handStroke} strokeWidth="2.6" strokeLinecap="round" />
      <Path d="M38 50 L46 47" stroke={handStroke} strokeWidth="2.6" strokeLinecap="round" />
      <Circle cx="38" cy="50" r="1.6" fill="#FFC857" />
    </Svg>
  );
}
