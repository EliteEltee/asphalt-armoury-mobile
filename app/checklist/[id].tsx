import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completed_at?: string;
}

interface Photo {
  id: string;
  base64_data: string;
  description: string;
  timestamp: string;
}

interface VehicleChecklist {
  id: string;
  title: string;
  vehicle_info: any;
  engine_info: any;
  tasks: ChecklistItem[];
  parts_to_install: ChecklistItem[];
  maintenance: ChecklistItem[];
  research_items: ChecklistItem[];
  photos: Photo[];
  created_at: string;
  updated_at: string;
}

export default function ChecklistDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [checklist, setChecklist] = React.useState<VehicleChecklist | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [newItemText, setNewItemText] = React.useState('');
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = React.useState<Photo | null>(null);
  const [photoModalVisible, setPhotoModalVisible] = React.useState(false);

  const loadChecklist = async () => {
    try {
      const stored = await AsyncStorage.getItem(`checklist_${id}`);
      if (stored) {
        setChecklist(JSON.parse(stored));
      } else {
        Alert.alert('Error', 'Checklist not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
      Alert.alert('Error', 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadChecklist();
    }, [id])
  );

  const saveChecklist = async (updatedChecklist: VehicleChecklist) => {
    try {
      const updated = {
        ...updatedChecklist,
        updated_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`checklist_${id}`, JSON.stringify(updated));
      
      // Update the main list
      const existing = await AsyncStorage.getItem('vehicle_checklists');
      const checklists = existing ? JSON.parse(existing) : [];
      const index = checklists.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        checklists[index] = {
          id: updated.id,
          title: updated.title,
          vehicle_info: updated.vehicle_info,
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        };
        await AsyncStorage.setItem('vehicle_checklists', JSON.stringify(checklists));
      }
      
      setChecklist(updated);
    } catch (error) {
      console.error('Error saving checklist:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const addItem = async (section: string) => {
    if (!checklist || !newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
    };

    const updatedChecklist = {
      ...checklist,
      [section]: [...checklist[section as keyof VehicleChecklist] as ChecklistItem[], newItem],
    };

    await saveChecklist(updatedChecklist);
    setNewItemText('');
    setActiveSection(null);
  };

  const toggleItem = async (section: string, itemId: string) => {
    if (!checklist) return;

    const items = [...checklist[section as keyof VehicleChecklist] as ChecklistItem[]];
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      items[itemIndex] = {
        ...items[itemIndex],
        completed: !items[itemIndex].completed,
        completed_at: !items[itemIndex].completed ? new Date().toISOString() : undefined,
      };

      const updatedChecklist = {
        ...checklist,
        [section]: items,
      };

      await saveChecklist(updatedChecklist);
    }
  };

  const addPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permissions are required to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const photo: Photo = {
          id: Date.now().toString(),
          base64_data: result.assets[0].base64,
          description: '',
          timestamp: new Date().toISOString(),
        };

        const updatedChecklist = {
          ...checklist!,
          photos: [...checklist!.photos, photo],
        };

        await saveChecklist(updatedChecklist);
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Error', 'Failed to add photo');
    }
  };

  const updatePhotoDescription = async (photoId: string, description: string) => {
    if (!checklist) return;

    const photos = checklist.photos.map(photo =>
      photo.id === photoId ? { ...photo, description } : photo
    );

    const updatedChecklist = {
      ...checklist,
      photos,
    };

    await saveChecklist(updatedChecklist);
  };

  const deletePhoto = async (photoId: string) => {
    if (!checklist) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const photos = checklist.photos.filter(photo => photo.id !== photoId);
            const updatedChecklist = {
              ...checklist,
              photos,
            };
            await saveChecklist(updatedChecklist);
          }
        }
      ]
    );
  };

  const renderSection = (title: string, section: string, items: ChecklistItem[]) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity
          onPress={() => setActiveSection(activeSection === section ? null : section)}
          style={styles.addButton}
        >
          <Ionicons 
            name={activeSection === section ? "remove" : "add"} 
            size={20} 
            color="#007AFF" 
          />
        </TouchableOpacity>
      </View>

      {activeSection === section && (
        <View style={styles.addItemContainer}>
          <TextInput
            style={styles.addItemInput}
            value={newItemText}
            onChangeText={setNewItemText}
            placeholder={`Add new ${title.toLowerCase().slice(0, -1)}...`}
            multiline
            returnKeyType="done"
            onSubmitEditing={() => addItem(section)}
          />
          <TouchableOpacity
            onPress={() => addItem(section)}
            style={styles.submitButton}
            disabled={!newItemText.trim()}
          >
            <Text style={[styles.submitButtonText, !newItemText.trim() && styles.disabledText]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.checklistItem}
          onPress={() => toggleItem(section, item.id)}
        >
          <Ionicons
            name={item.completed ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={item.completed ? "#34C759" : "#C7C7CC"}
          />
          <View style={styles.itemTextContainer}>
            <Text style={[styles.itemText, item.completed && styles.completedText]}>
              {item.text}
            </Text>
            {item.completed && item.completed_at && (
              <Text style={styles.completedTime}>
                Completed: {new Date(item.completed_at).toLocaleString()}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {items.length === 0 && (
        <Text style={styles.emptySection}>No items yet. Tap + to add one.</Text>
      )}
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
          <Text style={styles.errorText}>Checklist not found</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {checklist.title}
        </Text>
        <TouchableOpacity onPress={() => router.push(`/vehicle-info/${id}`)}>
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Summary */}
        <View style={styles.vehicleSummary}>
          <Ionicons name="car" size={32} color="#007AFF" />
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleTitle}>
              {checklist.vehicle_info.year} {checklist.vehicle_info.make} {checklist.vehicle_info.model}
            </Text>
            <Text style={styles.vehicleSubtitle}>
              {checklist.vehicle_info.series && `${checklist.vehicle_info.series} • `}
              {checklist.vehicle_info.vin && `VIN: ${checklist.vehicle_info.vin.slice(-6)}`}
            </Text>
          </View>
        </View>

        {/* Checklist Sections */}
        {renderSection('Tasks to be Completed', 'tasks', checklist.tasks)}
        {renderSection('Parts to be Installed', 'parts_to_install', checklist.parts_to_install)}
        {renderSection('Maintenance to be Completed', 'maintenance', checklist.maintenance)}
        {renderSection('Parts/Modifications to Research', 'research_items', checklist.research_items)}

        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity onPress={addPhoto} style={styles.addButton}>
              <Ionicons name="camera" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {checklist.photos.length === 0 ? (
            <Text style={styles.emptySection}>No photos yet. Tap camera to add one.</Text>
          ) : (
            <View style={styles.photosGrid}>
              {checklist.photos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoThumbnail}
                  onPress={() => {
                    setSelectedPhoto(photo);
                    setPhotoModalVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${photo.base64_data}` }}
                    style={styles.thumbnailImage}
                  />
                  {photo.description && (
                    <Text style={styles.photoDescription} numberOfLines={2}>
                      {photo.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Photo Modal */}
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)}>
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => selectedPhoto && deletePhoto(selectedPhoto.id)}
              >
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            
            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${selectedPhoto.base64_data}` }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.descriptionInput}
                  value={selectedPhoto.description}
                  onChangeText={(text) => {
                    setSelectedPhoto({ ...selectedPhoto, description: text });
                  }}
                  onEndEditing={() => {
                    if (selectedPhoto) {
                      updatePhotoDescription(selectedPhoto.id, selectedPhoto.description);
                    }
                  }}
                  placeholder="Add a description..."
                  multiline
                  numberOfLines={2}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
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
  vehicleSummary: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  vehicleDetails: {
    marginLeft: 16,
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    padding: 4,
  },
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    marginRight: 8,
    maxHeight: 80,
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
  },
  itemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  completedTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  emptySection: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  photoThumbnail: {
    width: (width - 64) / 3,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8F8F8',
  },
  thumbnailImage: {
    width: '100%',
    height: 80,
  },
  photoDescription: {
    fontSize: 12,
    color: '#000',
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 32,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  fullImage: {
    width: '100%',
    height: 300,
  },
  descriptionInput: {
    padding: 16,
    fontSize: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    minHeight: 60,
  },
  bottomSpacing: {
    height: 32,
  },
});