import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Animated, Pressable, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Download } from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { humanize, formatCurrency, numberToWords } from '../utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function InvoiceModal({ isOpen, onClose, booking, user }) {
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(modalTranslateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const formatDateTime = (value, withTime = true) => {
    if (!value) return 'Not set';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Not set';
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    if (withTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return parsed.toLocaleDateString('en-US', options);
  };

  const formatDeliveryDate = (raw) => {
    if (!raw) return 'Not set';

    if (raw.includes?.('T')) {
      const parsedISO = new Date(raw);
      if (!Number.isNaN(parsedISO.getTime())) {
        return parsedISO.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    }

    const [datePart, timePart] = raw.split(' ');
    const dateSegments = datePart?.split('/') || [];

    if (dateSegments.length !== 3) return 'Not set';

    const [dayStr, monthStr, yearStr] = dateSegments;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);

    if ([day, month, year].some(Number.isNaN)) return 'Not set';

    let hours = 0;
    let minutes = 0;

    if (timePart) {
      const [hm, ampm] = timePart.split(/(AM|PM)/i).filter(Boolean);
      if (hm) {
        const [hr, min] = hm.split(':').map(Number);
        hours = Number.isNaN(hr) ? 0 : hr;
        minutes = Number.isNaN(min) ? 0 : min;
      }

      if (ampm) {
        const upper = ampm.toUpperCase();
        if (upper === 'PM' && hours !== 12) hours += 12;
        if (upper === 'AM' && hours === 12) hours = 0;
      }
    }

    const parsed = new Date(year, month - 1, day, hours, minutes);
    if (Number.isNaN(parsed.getTime())) return 'Not set';
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCustomerField = (bookingField, fallbackUserField, defaultText = '—') => {
    return bookingField || fallbackUserField || defaultText;
  };

  const generateInvoiceHTML = () => {
    const now = new Date();
    const invoiceId = `INV-${booking.id}-${now.getTime()}`;
    const invoiceDate = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const customerData = {
      name: getCustomerField(booking?.Customer?.name, user?.name, 'Valued Customer'),
      company: getCustomerField(booking?.Customer?.company, user?.company),
      email: getCustomerField(booking?.Customer?.email, user?.email),
      phone: getCustomerField(booking?.Customer?.phone, user?.phone),
    };

    const vehicleData = {
      cargoWeight: booking.cargoWeight ? `${booking.cargoWeight} kg` : null,
      description: booking.description,
    };

    const locationData = {
      bookingDate: formatDateTime(booking.createdAt, false),
      deliveryDate: formatDeliveryDate(booking.deliveryDate),
    };

    const estimatedAmount = Number(booking?.budget) || 0;
    const finalAmount = booking.totalAmount 
      ? parseFloat(booking.budget) - parseFloat(booking.totalAmount)
      : estimatedAmount;
    const discountAmount = booking.totalAmount ? parseFloat(booking.totalAmount) : 0;
    const isSalesTaxApplicable = booking?.salesTax === true || booking?.salesTax === 'true';

    const amountWords = numberToWords(finalAmount);

    const printStyles = `
      @media print {
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          margin: 0;
          padding: 5px;
          font-size: 10px;
        }
      }
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        margin: 0;
        padding: 10px;
        color: #111827;
        background: #ffffff;
        font-size: 11px;
      }
      .invoice-container {
        max-width: 100%;
        margin: 0 auto;
        background: #ffffff;
        padding: 10px;
      }
      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .invoice-title {
        font-size: 18px;
        margin: 0 0 4px 0;
        color: #111827;
      }
      .invoice-booking-id {
        margin: 4px 0 0;
        color: #4b5563;
      }
      .invoice-meta {
        text-align: right;
        font-size: 10px;
        color: #6b7280;
        line-height: 1.5;
      }
      .three-card-layout {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 15px;
      }
      .card-section {
        background: #f9fafb;
        border-radius: 6px;
        padding: 12px;
        border: 1px solid #e5e7eb;
      }
      .section-title {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #111827;
        margin-top: 0;
        padding-bottom: 4px;
        border-bottom: 1px solid #e5e7eb;
      }
      .info-item {
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid #e5e7eb;
      }
      .info-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      .info-item label {
        display: block;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        margin-bottom: 3px;
        font-weight: 600;
      }
      .info-item span {
        font-size: 11px;
        font-weight: 600;
        color: #111827;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        display: block;
        line-height: 1.4;
      }
      .service-details-section {
        margin-top: 0;
        padding-top: 0;
      }
      .service-details-section .section-title {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 8px;
        margin-top: 0;
        color: #111827;
        padding-bottom: 4px;
        border-bottom: 1px solid #e5e7eb;
      }
      .amount-summary {
        margin-top: 8px;
        margin-bottom: 8px;
      }
      .amount-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .amount-row:last-child {
        border-bottom: none;
      }
      .amount-row.total {
        margin-top: 8px;
        padding-top: 12px;
        border-top: 2px solid #111827;
        border-bottom: 2px solid #111827;
        font-weight: 700;
      }
      .amount-label {
        font-size: 11px;
        color: #6b7280;
        font-weight: 600;
      }
      .amount-value {
        font-size: 12px;
        font-weight: 600;
        color: #111827;
      }
      .amount-value.discount {
        color: #10b981;
      }
      .amount-row.total .amount-value {
        font-size: 14px;
      }
      .amount-words {
        font-style: italic;
        margin-top: 6px;
        color: #374151;
        font-size: 10px;
        padding: 8px;
        background: #f9fafb;
        border-radius: 4px;
      }
      .footer-note {
        margin-top: 12px;
        font-size: 9px;
        color: #6b7280;
        line-height: 1.4;
        padding-top: 8px;
        border-top: 1px solid #e5e7eb;
      }
    `;

    const createInfoItem = (label, value) => {
      if (!value) return '';
      return `<div class="info-item">
        <label>${label}</label>
        <span>${value}</span>
      </div>`;
    };

    const createCardSection = (title, items) => {
      const itemsHTML = items
        .map(item => createInfoItem(item.label, item.value))
        .filter(Boolean)
        .join('');
      
      return `<div class="card-section">
        <h3 class="section-title">${title}</h3>
        ${itemsHTML}
      </div>`;
    };

    const createAmountRow = (label, value, isTotal = false, isDiscount = false) => {
      const totalClass = isTotal ? ' total' : '';
      const discountClass = isDiscount ? ' discount' : '';
      return `<div class="amount-row${totalClass}">
        <span class="amount-label">${label}</span>
        <span class="amount-value${discountClass}">${value}</span>
      </div>`;
    };

    const customerCard = createCardSection('Customer Information', [
      { label: 'Name', value: customerData.name },
      { label: 'Company', value: customerData.company },
      { label: 'Email', value: customerData.email },
      { label: 'Phone', value: customerData.phone },
    ]);

    const vehicleCard = createCardSection('Vehicle Information', [
      { label: 'Vehicle Type', value: humanize(booking.vehicleType) },
      { label: 'Cargo Type', value: humanize(booking.loadType || booking.cargoType) },
      { label: 'Cargo Weight (kg)', value: vehicleData.cargoWeight },
      { label: 'Cargo Description', value: vehicleData.description },
    ]);

    const locationCard = createCardSection('Location Details', [
      { label: 'Pickup Location', value: booking.fromLocation || booking.pickupLocation },
      { label: 'Drop Off Location', value: booking.toLocation || booking.dropLocation },
      { label: 'Booking Date', value: locationData.bookingDate },
      { label: 'Delivery Date', value: locationData.deliveryDate },
      { label: 'Status', value: humanize(booking.status) },
    ]);

    const amountRows = [
      createAmountRow('Estimated Amount:', `PKR ${formatCurrency(estimatedAmount)}`),
      discountAmount > 0 
        ? createAmountRow('Discount:', `-PKR ${formatCurrency(discountAmount)}`, false, true)
        : '',
      createAmountRow('Sales Tax Invoice:', isSalesTaxApplicable ? 'Yes' : 'No'),
      createAmountRow('Grand Total:', `PKR ${formatCurrency(finalAmount)} + sales Tax`, true),
    ].filter(Boolean).join('');

    return `<!DOCTYPE html>
<html>
  <head>
    <title>Invoice ${invoiceId}</title>
    <style>${printStyles}</style>
  </head>
  <body>
    <div class="invoice-container">
      <div class="invoice-header">
        <div>
          <h1 class="invoice-title">Cargo360 Shipment Invoice</h1>
          <p class="invoice-booking-id">Booking ID: C360-PK-${booking.id}</p>
        </div>
        <div class="invoice-meta">
          <div><strong>Invoice #:</strong> ${invoiceId}</div>
          <div><strong>Date:</strong> ${invoiceDate}</div>
        </div>
      </div>
      <div class="three-card-layout">
        ${customerCard}
        ${vehicleCard}
        ${locationCard}
      </div>
      <div class="service-details-section">
        <h3 class="section-title">Service Details</h3>
        <div class="amount-summary">
          ${amountRows}
        </div>
        <div class="amount-words">
          <strong>Amount in words:</strong> ${amountWords} + sales Tax
        </div>
      </div>
      <p class="footer-note">
        This invoice is generated for your confirmed Cargo360 shipment. Please retain a copy for your records.
        For any questions, contact info@cargo360pk.com.
      </p>
    </div>
  </body>
</html>`;
  };

  const handleGeneratePDF = async () => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const htmlContent = generateInvoiceHTML();
      
      // Generate PDF from HTML
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      setIsGeneratingPDF(false);
      
      // Show options to share or save
      Alert.alert(
        'Invoice PDF Generated',
        'What would you like to do with the invoice?',
        [
          {
            text: 'Share',
            onPress: () => handleSharePDF(uri),
          },
          {
            text: 'Download/Save',
            onPress: () => handleSavePDF(uri),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      setIsGeneratingPDF(false);
      console.error('Error generating PDF:', error);
      Alert.alert(
        'Error',
        'Failed to generate PDF. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSharePDF = async (uri) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Invoice PDF',
        });
      } else {
        Alert.alert(
          'Sharing Not Available',
          'Sharing is not available on this device.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert(
        'Error',
        'Failed to share PDF. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSavePDF = async (uri) => {
    try {
      const invoiceId = `INV-${booking.id}-${Date.now()}`;
      const fileName = `Cargo360_Invoice_${invoiceId}.pdf`;
      
      // For Android, we can save to Downloads folder
      // For iOS, files are saved in the app's document directory
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Copy the PDF to a permanent location
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      });

      // Try to share it so user can save it
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Invoice PDF',
        });
      } else {
        Alert.alert(
          'PDF Saved',
          `Invoice PDF has been saved to: ${fileName}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      Alert.alert(
        'Error',
        'Failed to save PDF. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };


  const now = new Date();
  const invoiceId = `INV-${booking.id}-${now.getTime()}`;
  const invoiceDate = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const bookingDate = formatDateTime(booking.createdAt, false);
  const deliveryDate = formatDeliveryDate(booking.deliveryDate);
  const customerName = getCustomerField(booking?.Customer?.name, user?.name, 'Valued Customer');
  const customerCompany = getCustomerField(booking?.Customer?.company, user?.company);
  const customerEmail = getCustomerField(booking?.Customer?.email, user?.email);
  const customerPhone = getCustomerField(booking?.Customer?.phone, user?.phone);
  const estimatedAmount = Number(booking?.budget) || 0;
  const finalAmount = booking.totalAmount 
    ? parseFloat(booking.budget) - parseFloat(booking.totalAmount)
    : estimatedAmount;
  const discountAmount = booking.totalAmount 
    ? parseFloat(booking.totalAmount) 
    : 0;
  const isSalesTaxApplicable = booking?.salesTax === true || booking?.salesTax === 'true';
  const amountWords = numberToWords(finalAmount);

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.modalBackdrop,
          {
            opacity: modalOpacity,
          },
        ]}
      >
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalCard,
            {
              transform: [{ translateY: modalTranslateY }],
            },
          ]}
        >
            <LinearGradient
              colors={['#01304e', '#ed8411']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <FontAwesome5 name="file-invoice" size={20} color="#FFFFFF" solid style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Cargo360 Shipment Invoice</Text>
              </View>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  title="Generate PDF"
                >
                  {isGeneratingPDF ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Download size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView 
              style={styles.modalContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.invoiceContainer}>
                <View style={styles.invoiceHeader}>
                  <Text style={styles.invoiceTitle}>Cargo360 Shipment Invoice</Text>
                  <Text style={styles.invoiceBookingId}>Booking ID: C360-PK-{booking.id}</Text>
                  <View style={styles.invoiceMeta}>
                    <Text style={styles.invoiceMetaText}><Text style={styles.bold}>Invoice #:</Text> {invoiceId}</Text>
                    <Text style={styles.invoiceMetaText}><Text style={styles.bold}>Date:</Text> {invoiceDate}</Text>
                  </View>
                </View>

                {/* Three Card Layout */}
                <View style={styles.cardLayout}>
                  {/* Customer Information */}
                  <View style={styles.cardSection}>
                    <Text style={styles.cardSectionTitle}>Customer Information</Text>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Name</Text>
                      <Text style={styles.infoValue}>{customerName}</Text>
                    </View>
                    {customerCompany && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Company</Text>
                        <Text style={styles.infoValue}>{customerCompany}</Text>
                      </View>
                    )}
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{customerEmail}</Text>
                    </View>
                    {customerPhone && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>{customerPhone}</Text>
                      </View>
                    )}
                  </View>

                  {/* Vehicle Information */}
                  <View style={styles.cardSection}>
                    <Text style={styles.cardSectionTitle}>Vehicle Information</Text>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Vehicle Type</Text>
                      <Text style={styles.infoValue}>{humanize(booking.vehicleType)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Cargo Type</Text>
                      <Text style={styles.infoValue}>{humanize(booking.loadType || booking.cargoType)}</Text>
                    </View>
                    {booking.cargoWeight && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Cargo Weight (kg)</Text>
                        <Text style={styles.infoValue}>{booking.cargoWeight} kg</Text>
                      </View>
                    )}
                    {booking.description && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Cargo Description</Text>
                        <Text style={styles.infoValue}>{booking.description}</Text>
                      </View>
                    )}
                  </View>

                  {/* Location Details */}
                  <View style={styles.cardSection}>
                    <Text style={styles.cardSectionTitle}>Location Details</Text>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Pickup Location</Text>
                      <Text style={styles.infoValue}>{booking.fromLocation || booking.pickupLocation}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Drop Off Location</Text>
                      <Text style={styles.infoValue}>{booking.toLocation || booking.dropLocation}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Booking Date</Text>
                      <Text style={styles.infoValue}>{bookingDate}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Delivery Date</Text>
                      <Text style={styles.infoValue}>{deliveryDate}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Status</Text>
                      <Text style={styles.infoValue}>{humanize(booking.status)}</Text>
                    </View>
                  </View>
                </View>

                {/* Service Details */}
                <View style={styles.serviceDetailsSection}>
                  <Text style={styles.sectionTitle}>Service Details</Text>
                  <View style={styles.amountSummary}>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Estimated Amount:</Text>
                      <Text style={styles.amountValue}>PKR {formatCurrency(estimatedAmount)}</Text>
                    </View>
                    {discountAmount > 0 && (
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Discount:</Text>
                        <Text style={[styles.amountValue, styles.discount]}>-PKR {formatCurrency(discountAmount)}</Text>
                      </View>
                    )}
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Sales Tax Invoice:</Text>
                      <Text style={styles.amountValue}>{isSalesTaxApplicable ? 'Yes' : 'No'}</Text>
                    </View>
                    <View style={[styles.amountRow, styles.amountRowTotal]}>
                      <Text style={styles.amountLabel}>Grand Total:</Text>
                      <Text style={styles.amountValue}>PKR {formatCurrency(finalAmount)} + sales Tax</Text>
                    </View>
                  </View>
                  <View style={styles.amountWords}>
                    <Text style={styles.amountWordsText}><Text style={styles.bold}>Amount in words:</Text> {amountWords} + sales Tax</Text>
                  </View>
                </View>

                <Text style={styles.footerNote}>
                  This invoice is generated for your confirmed Cargo360 shipment. Please retain a copy for your records.
                  For any questions, contact info@cargo360pk.com.
                </Text>
              </View>
            </ScrollView>
          </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    left: '2.5%',
    right: '2.5%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '95%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 4,
  },
  printButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  invoiceContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  invoiceHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 16,
    marginBottom: 20,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  invoiceBookingId: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 4,
  },
  invoiceMeta: {
    marginTop: 12,
  },
  invoiceMetaText: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
  },
  cardLayout: {
    marginBottom: 20,
  },
  cardSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#01304e',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  infoItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  serviceDetailsSection: {
    marginTop: 0,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#01304e',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  amountSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  amountRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
  },
  amountLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 0,
    textAlign: 'right',
  },
  discount: {
    color: '#10b981',
  },
  amountWords: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  amountWordsText: {
    fontSize: 11,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  footerNote: {
    marginTop: 20,
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

export default InvoiceModal;
