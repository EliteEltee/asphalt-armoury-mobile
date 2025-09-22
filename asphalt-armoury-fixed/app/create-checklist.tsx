import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useForm, Controller } from 'react-hook-form';

interface VehicleInfo {
  make: string;
  model: string;
  series: string;
  year: string;
  bodyType: string;
  doors: string;
  assembly: string;
  licensing: string;
  purchaseDate: string;
  vin: string;
  buildDate: string;
  trimCode: string;
  optionCode: string;
  odometer: string;
  paintColor: string;
  engine: string;
  transmission: string;
  drive: string;
  layout: string;
  rimSize: string;
  tyreSize: string;
  weight: string;
  wheelbase: string;
  length: string;
  height: string;
  width: string;
}

interface EngineInfo {
  engineNumber: string;
  engineCode: string;
  description: string;
  bore: string;
  stroke: string;
  compressionRatio: string;
  power: string;
  torque: string;
}

interface FormData {
  title: string;
  vehicleInfo: VehicleInfo;
  engineInfo: EngineInfo;
}

export default function CreateChecklist() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: '',
      vehicleInfo: {
        make: '',
        model: '',
        series: '',
        year: '',
        bodyType: '',
        doors: '',
        assembly: '',
        licensing: '',
        purchaseDate: '',
        vin: '',
        buildDate: '',
        trimCode: '',
        optionCode: '',
        odometer: '',
        paintColor: '',
        engine: '',
        transmission: '',
        drive: '',
        layout: '',
        rimSize: '',
        tyreSize: '',
        weight: '',
        wheelbase: '',
        length: '',
        height: '',
        width: '',
      },
      engineInfo: {
        engineNumber: '',
        engineCode: '',
        description: '',
        bore: '',
        stroke: '',
        compressionRatio: '',
        power: '',
        torque: '',
      },
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const checklistId = Date.now().toString();
      const newChecklist = {
        id: checklistId,
        title: data.title || `${data.vehicleInfo.year} ${data.vehicleInfo.make} ${data.vehicleInfo.model}`,
        vehicle_info: {
          make: data.vehicleInfo.make,
          model: data.vehicleInfo.model,
          year: data.vehicleInfo.year,
          ...data.vehicleInfo,
        },
        engine_info: data.engineInfo,
        tasks: [],
        parts_to_install: [],
        maintenance: [],
        research_items: [],
        photos: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to local storage
      const existing = await AsyncStorage.getItem('vehicle_checklists');
      const checklists = existing ? JSON.parse(existing) : [];
      checklists.push(newChecklist);
      await AsyncStorage.setItem('vehicle_checklists', JSON.stringify(checklists));

      // Save the current checklist for editing
      await AsyncStorage.setItem(`checklist_${checklistId}`, JSON.stringify(newChecklist));

      router.replace(`/checklist/${checklistId}`);
    } catch (error) {
      console.error('Error creating checklist:', error);
      Alert.alert('Error', 'Failed to create checklist. Please try again.');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const FormField: React.FC<{
    name: string;
    control: any;
    placeholder: string;
    label: string;
    required?: boolean;
  }> = ({ name, control, placeholder, label, required = false }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <Controller
        name={name}
        control={control}
        rules={required ? { required: `${label} is required` } : {}}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errors[name] && styles.inputError]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder={placeholder}
            placeholderTextColor="#C7C7CC"
          />
        )}
      />
      {errors[name] && (
        <Text style={styles.errorText}>{errors[name]?.message}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Checklist</Text>
          <TouchableOpacity onPress={handleSubmit(onSubmit)}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Checklist Title */}
          <FormSection title="Checklist Information">
            <FormField
              name="title"
              control={control}
              label="Checklist Title"
              placeholder="Enter checklist title (optional)"
            />
          </FormSection>

          {/* Vehicle Information */}
          <FormSection title="Vehicle Information">
            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.make"
                  control={control}
                  label="Make"
                  placeholder="e.g., Toyota"
                  required
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.model"
                  control={control}
                  label="Model"
                  placeholder="e.g., Camry"
                  required
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.series"
                  control={control}
                  label="Series/Variant"
                  placeholder="e.g., LE, Sport"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.year"
                  control={control}
                  label="Model Year"
                  placeholder="e.g., 2023"
                  required
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.bodyType"
                  control={control}
                  label="Body Type"
                  placeholder="e.g., Sedan"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.doors"
                  control={control}
                  label="Doors"
                  placeholder="e.g., 4"
                />
              </View>
            </View>

            <FormField
              name="vehicleInfo.vin"
              control={control}
              label="VIN #"
              placeholder="Vehicle Identification Number"
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.assembly"
                  control={control}
                  label="Assembly"
                  placeholder="Assembly location"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.licensing"
                  control={control}
                  label="Licensing"
                  placeholder="License plate"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.purchaseDate"
                  control={control}
                  label="Purchase Date"
                  placeholder="MM/DD/YYYY"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.buildDate"
                  control={control}
                  label="Build Date"
                  placeholder="MM/DD/YYYY"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.trimCode"
                  control={control}
                  label="Trim Code"
                  placeholder="Trim code"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.optionCode"
                  control={control}
                  label="Option Code"
                  placeholder="Option code"
                />
              </View>
            </View>

            <FormField
              name="vehicleInfo.odometer"
              control={control}
              label="Odometer"
              placeholder="Current mileage"
            />

            <FormField
              name="vehicleInfo.paintColor"
              control={control}
              label="Paint Colour/Code"
              placeholder="Color name and code"
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.engine"
                  control={control}
                  label="Engine"
                  placeholder="Engine type"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.transmission"
                  control={control}
                  label="Transmission"
                  placeholder="Transmission type"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.drive"
                  control={control}
                  label="Drive"
                  placeholder="e.g., FWD, AWD"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.layout"
                  control={control}
                  label="Layout"
                  placeholder="Engine layout"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.rimSize"
                  control={control}
                  label="Rim Size"
                  placeholder="e.g., 18 inch"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.tyreSize"
                  control={control}
                  label="Tyre Size"
                  placeholder="e.g., 225/60R18"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.weight"
                  control={control}
                  label="Weight"
                  placeholder="Vehicle weight"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="vehicleInfo.wheelbase"
                  control={control}
                  label="Wheelbase"
                  placeholder="Wheelbase length"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.thirdField}>
                <FormField
                  name="vehicleInfo.length"
                  control={control}
                  label="Length"
                  placeholder="Length"
                />
              </View>
              <View style={styles.thirdField}>
                <FormField
                  name="vehicleInfo.height"
                  control={control}
                  label="Height"
                  placeholder="Height"
                />
              </View>
              <View style={styles.thirdField}>
                <FormField
                  name="vehicleInfo.width"
                  control={control}
                  label="Width"
                  placeholder="Width"
                />
              </View>
            </View>
          </FormSection>

          {/* Engine Information */}
          <FormSection title="Engine Details">
            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="engineInfo.engineNumber"
                  control={control}
                  label="Engine #"
                  placeholder="Engine number"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="engineInfo.engineCode"
                  control={control}
                  label="Engine Code"
                  placeholder="Engine code"
                />
              </View>
            </View>

            <FormField
              name="engineInfo.description"
              control={control}
              label="Description"
              placeholder="Engine description"
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="engineInfo.bore"
                  control={control}
                  label="Bore"
                  placeholder="Bore size"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="engineInfo.stroke"
                  control={control}
                  label="Stroke"
                  placeholder="Stroke length"
                />
              </View>
            </View>

            <FormField
              name="engineInfo.compressionRatio"
              control={control}
              label="Comp. Ratio"
              placeholder="Compression ratio"
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  name="engineInfo.power"
                  control={control}
                  label="Power"
                  placeholder="Power output"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  name="engineInfo.torque"
                  control={control}
                  label="Torque"
                  placeholder="Torque output"
                />
              </View>
            </View>
          </FormSection>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#000',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  halfField: {
    flex: 1,
    marginHorizontal: 8,
  },
  thirdField: {
    flex: 1,
    marginHorizontal: 4,
  },
  bottomSpacing: {
    height: 32,
  },
});