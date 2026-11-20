const conditions = [
  {
    label: "Brand New",
    value: "Brand New",
    color: "#10B981", // Emerald
    bg: "#ECFDF5",
    icon: "sparkles",
    description: "Unopened in original packaging, never used",
  },
  {
    label: "Like New",
    value: "Like New",
    color: "#06B6D4", // Cyan
    bg: "#ECFEFF",
    icon: "check-decagram",
    description: "Mint condition with no signs of wear",
  },
  {
    label: "Good",
    value: "Good",
    color: "#3B82F6", // Blue
    bg: "#EFF6FF",
    icon: "thumb-up-outline",
    description: "Gently used, minor wear, fully functional",
  },
  {
    label: "Fair",
    value: "Fair",
    color: "#F59E0B", // Amber
    bg: "#FFFBEB",
    icon: "alert-circle-outline",
    description: "Visible wear or cosmetic flaws, works fine",
  },
  {
    label: "For Parts",
    value: "For Parts",
    color: "#64748B", // Slate
    bg: "#F8FAFC",
    icon: "wrench-outline",
    description: "Non-functional, damaged, or sold for parts",
  },
];

export const getConditionMeta = (conditionName) => {
  return (
    conditions.find((c) => c.value === conditionName) || {
      label: conditionName || "Good",
      value: conditionName || "Good",
      color: "#3B82F6",
      bg: "#EFF6FF",
      icon: "tag-outline",
      description: "Marketplace condition",
    }
  );
};

export default conditions;
