import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

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

interface VehicleChecklist {
  id: string;
  title: string;
  vehicleInfo: VehicleInfo;  
  engineInfo: EngineInfo;
  created_at: string;
  updated_at: string;
}

export default function VehicleInfo() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [checklist, setChecklist] = React.useState<VehicleChecklist | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadChecklist = async () => {
    try {
      const stored = await AsyncStorage.getItem(`checklist_${id}`);
      if (stored) {
        const data = JSON.parse(stored);
        setChecklist(data);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadChecklist();
    }, [id])
  );

  const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
    if (!value) return null;
    
    return (
      <View style={styles.infoRow}>
        <Text style={styles.label}>{label}:</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    );
  };

  const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!checklist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Vehicle information not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Information */}
        <InfoSection title="Vehicle Details">
          <InfoRow label="Make" value={checklist.vehicleInfo?.make || checklist.vehicle_info?.make || ''} />
          <InfoRow label="Model" value={checklist.vehicleInfo?.model || checklist.vehicle_info?.model || ''} />
          <InfoRow label="Series/Variant" value={checklist.vehicleInfo?.series || checklist.vehicle_info?.series || ''} />
          <InfoRow label="Model Year" value={checklist.vehicleInfo?.year || checklist.vehicle_info?.year || ''} />
          <InfoRow label="Body Type" value={checklist.vehicleInfo?.bodyType || checklist.vehicle_info?.bodyType || ''} />
          <InfoRow label="Doors" value={checklist.vehicleInfo?.doors || checklist.vehicle_info?.doors || ''} />
          <InfoRow label="Assembly" value={checklist.vehicleInfo?.assembly || checklist.vehicle_info?.assembly || ''} />
          <InfoRow label="Licensing" value={checklist.vehicleInfo?.licensing || checklist.vehicle_info?.licensing || ''} />
          <InfoRow label="Purchase Date" value={checklist.vehicleInfo?.purchaseDate || checklist.vehicle_info?.purchaseDate || ''} />
          <InfoRow label="VIN #" value={checklist.vehicleInfo?.vin || checklist.vehicle_info?.vin || ''} />
          <InfoRow label="Build Date" value={checklist.vehicleInfo?.buildDate || checklist.vehicle_info?.buildDate || ''} />
          <InfoRow label="Trim Code" value={checklist.vehicleInfo?.trimCode || checklist.vehicle_info?.trimCode || ''} />
          <InfoRow label="Option Code" value={checklist.vehicleInfo?.optionCode || checklist.vehicle_info?.optionCode || ''} />
          <InfoRow label="Odometer" value={checklist.vehicleInfo?.odometer || checklist.vehicle_info?.odometer || ''} />
          <InfoRow label="Paint Colour/Code" value={checklist.vehicleInfo?.paintColor || checklist.vehicle_info?.paintColor || ''} />
        </InfoSection>

        {/* Drivetrain Information */}
        <InfoSection title="Drivetrain & Performance">
          <InfoRow label="Engine" value={checklist.vehicleInfo?.engine || checklist.vehicle_info?.engine || ''} />
          <InfoRow label="Transmission" value={checklist.vehicleInfo?.transmission || checklist.vehicle_info?.transmission || ''} />
          <InfoRow label="Drive" value={checklist.vehicleInfo?.drive || checklist.vehicle_info?.drive || ''} />
          <InfoRow label="Layout" value={checklist.vehicleInfo?.layout || checklist.vehicle_info?.layout || ''} />
        </InfoSection>

        {/* Physical Specifications */}
        <InfoSection title="Physical Specifications">
          <InfoRow label="Rim Size" value={checklist.vehicleInfo?.rimSize || checklist.vehicle_info?.rimSize || ''} />
          <InfoRow label="Tyre Size" value={checklist.vehicleInfo?.tyreSize || checklist.vehicle_info?.tyreSize || ''} />
          <InfoRow label="Weight" value={checklist.vehicleInfo?.weight || checklist.vehicle_info?.weight || ''} />
          <InfoRow label="Wheelbase" value={checklist.vehicleInfo?.wheelbase || checklist.vehicle_info?.wheelbase || ''} />
          <InfoRow label="Length" value={checklist.vehicleInfo?.length || checklist.vehicle_info?.length || ''} />
          <InfoRow label="Height" value={checklist.vehicleInfo?.height || checklist.vehicle_info?.height || ''} />
          <InfoRow label="Width" value={checklist.vehicleInfo?.width || checklist.vehicle_info?.width || ''} />
        </InfoSection>

        {/* Engine Details */}
        <InfoSection title="Engine Details">
          <InfoRow 
            label="Engine #" 
            value={checklist.engineInfo?.engineNumber || checklist.engine_info?.engineNumber || ''} 
          />
          <InfoRow 
            label="Engine Code" 
            value={checklist.engineInfo?.engineCode || checklist.engine_info?.engineCode || ''} 
          />
          <InfoRow 
            label="Description" 
            value={checklist.engineInfo?.description || checklist.engine_info?.description || ''} 
          />
          <InfoRow 
            label="Bore" 
            value={checklist.engineInfo?.bore || checklist.engine_info?.bore || ''} 
          />
          <InfoRow 
            label="Stroke" 
            value={checklist.engineInfo?.stroke || checklist.engine_info?.stroke || ''} 
          />
          <InfoRow 
            label="Comp. Ratio" 
            value={checklist.engineInfo?.compressionRatio || checklist.engine_info?.compressionRatio || ''} 
          />
          <InfoRow 
            label="Power" 
            value={checklist.engineInfo?.power || checklist.engine_info?.power || ''} 
          />
          <InfoRow 
            label="Torque" 
            value={checklist.engineInfo?.torque || checklist.engine_info?.torque || ''} 
          />
        </InfoSection>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    width: 140,
    flexShrink: 0,
  },
  value: {
    fontSize: 16,
    color: '#3C3C43',
    flex: 1,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 32,
  },
});