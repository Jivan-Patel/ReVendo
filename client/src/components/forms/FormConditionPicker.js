import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useFormikContext } from "formik";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AppText from "../AppText";
import ErrorMessage from "./ErrorMessage";
import colors from "../../config/colors";
import conditions from "../../config/conditions";

function FormConditionPicker({ name = "condition" }) {
  const { errors, setFieldValue, touched, values } = useFormikContext();
  const selectedCondition = values[name] || "Good";

  const selectedMeta =
    conditions.find((c) => c.value === selectedCondition) || conditions[2];

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>Product Condition</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {conditions.map((item) => {
          const isSelected = selectedCondition === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              activeOpacity={0.8}
              style={[
                styles.chip,
                isSelected && {
                  backgroundColor: item.color,
                  borderColor: item.color,
                },
              ]}
              onPress={() => setFieldValue(name, item.value)}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={16}
                color={isSelected ? colors.white : item.color}
                style={{ marginRight: 5 }}
              />
              <AppText
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {item.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Helpful Description */}
      {selectedMeta && (
        <View
          style={[
            styles.helpBox,
            {
              backgroundColor: selectedMeta.bg,
              borderColor: selectedMeta.color + "30",
            },
          ]}
        >
          <AppText style={[styles.helpText, { color: selectedMeta.color }]}>
            {selectedMeta.description}
          </AppText>
        </View>
      )}

      <ErrorMessage error={errors[name]} visible={touched[name]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: "row",
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.dark,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: "700",
  },
  helpBox: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  helpText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default FormConditionPicker;
