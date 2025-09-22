import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

interface VehicleChecklist {
  id: string;
  title: string;
  vehicle_info: {
    make: string;
    model: string;
    year: string;
  };
  created_at: string;
  updated_at: string;
}

export default function Index() {
  const [checklists, setChecklists] = React.useState<VehicleChecklist[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const loadChecklists = async () => {
    try {
      const stored = await AsyncStorage.getItem('vehicle_checklists');
      if (stored) {
        setChecklists(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadChecklists();
    }, [])
  );

  const handleCreateNew = () => {
    router.push('/create-checklist');
  };

  const handleOpenChecklist = (id: string) => {
    router.push(`/checklist/${id}`);
  };

  const handleDeleteChecklist = async (id: string) => {
    Alert.alert(
      'Delete Checklist',
      'Are you sure you want to delete this checklist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedChecklists = checklists.filter(item => item.id !== id);
            setChecklists(updatedChecklists);
            await AsyncStorage.setItem('vehicle_checklists', JSON.stringify(updatedChecklists));
          }
        }
      ]
    );
  };

  const renderChecklistItem = ({ item }: { item: VehicleChecklist }) => (
    <View style={styles.checklistCard}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => handleOpenChecklist(item.id)}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="car-outline" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <Text style={styles.vehicleInfo}>
          {item.vehicle_info.year} {item.vehicle_info.make} {item.vehicle_info.model}
        </Text>
        <Text style={styles.dateText}>
          Updated: {new Date(item.updated_at).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteChecklist(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vehicle Checklists</Text>
      </View>

      {checklists.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No Checklists Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first vehicle checklist to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={checklists}
          keyExtractor={(item) => item.id}
          renderItem={renderChecklistItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateNew}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.createButtonText}>Create New Checklist</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    padding: 16,
  },
  checklistCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
    flex: 1,
  },
  vehicleInfo: {
    fontSize: 16,
    color: '#3C3C43',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  deleteButton: {
    padding: 16,
    paddingLeft: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});