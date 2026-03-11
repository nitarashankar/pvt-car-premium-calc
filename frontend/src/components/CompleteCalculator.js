import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Switch, FormControlLabel, Button,
  CircularProgress, Alert, Grid, Chip, Collapse, IconButton, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip
} from '@mui/material';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined';
import PercentOutlined from '@mui/icons-material/PercentOutlined';
import LocalGasStationOutlined from '@mui/icons-material/LocalGasStationOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import GavelOutlined from '@mui/icons-material/GavelOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import { jsPDF } from 'jspdf';
import calculatorAPI from '../services/api';

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getVehicleAge = (purchaseDate, renewalDate) => {
  if (!purchaseDate) return 0;
  const ref = renewalDate ? new Date(renewalDate) : new Date();
  const purchase = new Date(purchaseDate);
  const age = (ref - purchase) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.round(Math.max(0, age) * 100) / 100;
};

const defaultFormData = {
  customer_name: '',
  registration_no: '',
  mobile_no: '',
  policy_type: 'Package',
  vehicle_type: 'Rollover',
  cc_category: '1000cc_1500cc',
  zone: 'B',
  purchase_date: '2024-01-01',
  renewal_date: getTomorrowDate(),
  idv: 125000,
  ncb_percent: 0,
  od_discount_percent: 0,
  builtin_cng_lpg: 0,
  cng_lpg_si: 0,
  nil_dep: 1,
  return_to_invoice: 0,
  ncb_protect: 0,
  engine_protection: 0,
  consumables: 0,
  road_side_assistance: 0,
  geo_extension: 0,
  road_tax_cover: 0,
  road_tax_si: 0,
  courtesy_car: 0,
  additional_towing: 0,
  medical_expenses: 0,
  loss_of_key: 0,
  tyre_rim_si: 0,
  personal_effects: 0,
  cpa_owner_driver: 1,
  ll_paid_driver: 1,
  pa_unnamed_persons: 0,
  pa_unnamed_si: 0,
};

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const cardSx = {
  borderRadius: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  mb: 3,
};

const sectionHeader = (icon, title) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
    {icon}
    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f' }}>{title}</Typography>
  </Box>
);

const CompleteCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [showDiscountInPDF, setShowDiscountInPDF] = useState(true);
  const [paUnnamedEnabled, setPaUnnamedEnabled] = useState(false);

  // Compute vehicle age for restriction checks
  const vehicleAge = useMemo(() => getVehicleAge(formData.purchase_date, formData.renewal_date), [formData.purchase_date, formData.renewal_date]);
  const ncbValue = Number(formData.ncb_percent) || 0;

  // Nil Dep rules
  const nilDepDisabled = useMemo(() => {
    if (vehicleAge > 6.5) return true;
    if (vehicleAge > 4.5 && ncbValue < 25) return true;
    return false;
  }, [vehicleAge, ncbValue]);
  const nilDepMessage = useMemo(() => {
    if (vehicleAge > 6.5) return 'Nil depreciation cover is not allowed for vehicles more than 6.5 years old.';
    if (vehicleAge > 4.5 && ncbValue < 25) return 'Nil Depreciation cover is not allowed for vehicles more than 5 years old.';
    return '';
  }, [vehicleAge, ncbValue]);

  // Return to Invoice rule (age > 2.5)
  const rtiDisabled = vehicleAge > 2.5;
  const rtiMessage = rtiDisabled ? 'Return to invoice cover is not allowed for vehicles more than 2.5 years old.' : '';

  // 4.5yr restrictions
  const over45Disabled = vehicleAge > 4.5;
  const over45Msg = (name) => over45Disabled ? `${name} cover is not allowed for vehicles more than 4.5 years old.` : '';

  // NCB Protect rule
  const ncbProtectDisabled = ncbValue === 0;
  const ncbProtectMessage = ncbProtectDisabled ? 'NCB Protect cover is allowed only if there is NCB.' : '';

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
      };
      // When purchase/renewal date changes, enforce age-based restrictions
      if (name === 'purchase_date' || name === 'renewal_date') {
        const newAge = getVehicleAge(
          name === 'purchase_date' ? value : prev.purchase_date,
          name === 'renewal_date' ? value : prev.renewal_date
        );
        const newNcb = Number(prev.ncb_percent) || 0;
        // Nil Dep: disable if age > 6.5 or (age > 4.5 and NCB < 25)
        if (newAge > 6.5 || (newAge > 4.5 && newNcb < 25)) {
          updated.nil_dep = 0;
        }
        // RTI: disable if age > 2.5
        if (newAge > 2.5) {
          updated.return_to_invoice = 0;
        }
        // 4.5yr restrictions
        if (newAge > 4.5) {
          updated.consumables = 0;
          updated.engine_protection = 0;
          updated.loss_of_key = 0;
          updated.personal_effects = 0;
        }
      }
      // When NCB changes, enforce NCB-dependent rules
      if (name === 'ncb_percent') {
        const newNcb = Number(value) || 0;
        if (newNcb === 0) {
          updated.ncb_protect = 0;
        }
        // If NCB dropped below 25 and age > 4.5, disable nil_dep
        if (newNcb < 25 && vehicleAge > 4.5) {
          updated.nil_dep = 0;
        }
      }
      return updated;
    });
  };

  const handleSwitchChange = (name) => (e) => {
    const newVal = e.target.checked ? 1 : 0;
    setFormData((prev) => {
      const updated = { ...prev, [name]: newVal };
      // When built-in CNG/LPG is turned ON, set external CNG/LPG SI to 0
      if (name === 'builtin_cng_lpg' && newVal === 1) {
        updated.cng_lpg_si = 0;
      }
      // Road tax cover cannot be opted if Return to Invoice is opted
      if (name === 'road_tax_cover' && newVal === 1 && prev.return_to_invoice) {
        setError('Road Tax cover can not be opted if Return to Invoice has been selected');
        return prev;
      }
      // If Return to Invoice is turned ON, turn off Road Tax Cover
      if (name === 'return_to_invoice' && newVal === 1 && prev.road_tax_cover) {
        updated.road_tax_cover = 0;
        updated.road_tax_si = 0;
      }
      // When Road Tax Cover is turned OFF, reset SI
      if (name === 'road_tax_cover' && newVal === 0) {
        updated.road_tax_si = 0;
      }
      // Clear road tax error when conditions change
      if (name === 'return_to_invoice' && newVal === 0) {
        setError(null);
      }
      return updated;
    });
  };

  const handlePaUnnamedToggle = (e) => {
    const enabled = e.target.checked;
    setPaUnnamedEnabled(enabled);
    if (enabled) {
      setFormData((prev) => ({ ...prev, pa_unnamed_persons: 1, pa_unnamed_si: 100000 }));
    } else {
      setFormData((prev) => ({ ...prev, pa_unnamed_persons: 0, pa_unnamed_si: 0 }));
    }
  };

  const handleReset = () => {
    setFormData({ ...defaultFormData });
    setResult(null);
    setError(null);
    setPaUnnamedEnabled(false);
  };

  const validate = () => {
    if (!formData.cc_category) return 'Cubic capacity is required';
    if (!formData.zone) return 'Zone is required';
    if (!formData.purchase_date) return 'Purchase date is required';
    if (!formData.idv || Number(formData.idv) <= 0) return 'IDV must be greater than 0';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await calculatorAPI.calculatePremium(formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Calculation failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!result) return;
    const c = result.calculations;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    const fmt = (v) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtSI = (v) => {
      const n = Number(v);
      if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
      if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
      return String(n);
    };

    // Header with gradient-like bar
    doc.setFillColor(0, 102, 204);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Motor Insurance Premium Quotation', pageWidth / 2, 18, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 38;

    // Customer details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const customerDetails = [];
    if (formData.customer_name) customerDetails.push(['Customer Name', formData.customer_name]);
    if (formData.registration_no) customerDetails.push(['Vehicle Reg. No.', formData.registration_no]);
    if (formData.mobile_no) customerDetails.push(['Mobile No.', formData.mobile_no]);
    if (customerDetails.length > 0) {
      doc.setFillColor(245, 245, 250);
      doc.rect(15, y - 5, pageWidth - 30, customerDetails.length * 6 + 4, 'F');
      customerDetails.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), 75, y);
        y += 6;
      });
      y += 4;
    }

    // Vehicle Details section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 204);
    doc.text('VEHICLE DETAILS', 20, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const vehicleDetails = [
      ['Policy Type', formData.policy_type],
      ['Vehicle Type', formData.vehicle_type],
      ['CC Category', formData.cc_category],
      ['Zone', `Zone ${formData.zone}`],
      ['Purchase Date', formData.purchase_date],
      ['Renewal Date', formData.renewal_date || 'N/A'],
      ['IDV', `Rs. ${Number(formData.idv).toLocaleString('en-IN')}`],
      ['Vehicle Age', `${Number(c.age_years).toFixed(2)} years`],
      ['NCB', `${ncbValue}%`],
    ];
    vehicleDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 25, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 75, y);
      y += 5;
    });
    y += 4;

    // Premium breakdown
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 204);
    doc.text('PREMIUM BREAKDOWN', 20, y);
    doc.setTextColor(0, 0, 0);
    y += 6;

    // Table header
    doc.setFillColor(0, 102, 204);
    doc.rect(15, y - 4, pageWidth - 30, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Component', 20, y);
    doc.text('Amount', pageWidth - 20, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 7;

    // Table rows
    let rowIndex = 0;
    const addRow = (label, value, isBold, isNegative) => {
      if (y > 255) { doc.addPage(); y = 20; }
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 252);
        doc.rect(15, y - 4, pageWidth - 30, 6, 'F');
      }
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.text(label, 20, y);
      const color = isNegative ? [220, 50, 50] : [0, 0, 0];
      doc.setTextColor(...color);
      doc.text((isNegative ? '-' : '') + fmt(value), pageWidth - 20, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      y += 5.5;
      rowIndex++;
    };

    const addSection = (title) => {
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFillColor(230, 240, 255);
      doc.rect(15, y - 4, pageWidth - 30, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 80, 160);
      doc.text(title, 20, y);
      doc.setTextColor(0, 0, 0);
      y += 6;
      rowIndex = 0;
    };

    // OD Premiums
    addSection('OWN DAMAGE PREMIUMS');
    addRow('Basic OD Premium', c.basic_od_premium);
    if (c.nil_dep_premium > 0) addRow('Zero Depreciation', c.nil_dep_premium);
    if (c.engine_protection_premium > 0) addRow('Engine & Gearbox Protection - Platinum', c.engine_protection_premium);
    if (c.road_side_assistance_premium > 0) addRow('Road Side Assistance', c.road_side_assistance_premium);
    if (c.return_to_invoice_premium > 0) addRow('Return to Invoice', c.return_to_invoice_premium);
    if (c.ncb_protect_premium > 0) addRow('NCB Protect', c.ncb_protect_premium);
    if (c.consumables_premium > 0) addRow('Consumables', c.consumables_premium);
    if (c.geo_extension_od_premium > 0) addRow('Geographical Extension OD', c.geo_extension_od_premium);
    if (c.builtin_cng_od_premium > 0) addRow('Built-in CNG/LPG OD', c.builtin_cng_od_premium);
    if (c.cng_lpg_od_premium > 0) addRow('CNG/LPG OD', c.cng_lpg_od_premium);
    if (c.loss_of_key_premium > 0) addRow('Loss of Key (SI - Rs.25k)', c.loss_of_key_premium);
    if (c.towing_charges_premium > 0) addRow('Additional Towing Charges (SI - Rs.1.5k)', c.towing_charges_premium);
    if (c.medical_expenses_premium > 0) addRow('Medical Expenses (Option 2)', c.medical_expenses_premium);
    if (c.tyre_rim_premium > 0) addRow(`Tyre & Rim Protector (SI - Rs.${fmtSI(formData.tyre_rim_si)})`, c.tyre_rim_premium);
    if (c.personal_effects_premium > 0) addRow('Personal Effects (SI - Rs.10k)', c.personal_effects_premium);
    if (c.courtesy_car_premium > 0) addRow('Courtesy Car (for 7 days)', c.courtesy_car_premium);
    if (c.road_tax_premium > 0) addRow(`Road Tax Cover (SI - Rs.${fmtSI(formData.road_tax_si || formData.idv * 0.2)})`, c.road_tax_premium);

    // TP Premiums
    addSection('THIRD PARTY PREMIUMS');
    addRow('Basic TP Premium', c.basic_tp_premium);
    if (c.cpa_owner_premium > 0) addRow('CPA Owner Driver (SI - Rs.15L)', c.cpa_owner_premium);
    if (c.ll_paid_driver_premium > 0) addRow('LL to Paid Driver', c.ll_paid_driver_premium);
    if (c.cng_lpg_tp_premium > 0) addRow('CNG/LPG TP', c.cng_lpg_tp_premium);
    if (c.geo_extension_tp_premium > 0) addRow('Geographical Extension TP', c.geo_extension_tp_premium);
    if (c.pa_unnamed_premium > 0) {
      const persons = Number(formData.pa_unnamed_persons) || 0;
      const si = Number(formData.pa_unnamed_si) || 0;
      addRow(`PA Cover - Unnamed Persons (${persons} ${persons === 1 ? 'person' : 'persons'} - Rs.${fmtSI(si)} each)`, c.pa_unnamed_premium);
    }

    // Discounts - conditional on toggle
    if (showDiscountInPDF && (c.od_discount_amount > 0 || c.ncb_discount_amount > 0)) {
      addSection('DISCOUNTS');
      if (c.od_discount_amount > 0) addRow('OD Discount', c.od_discount_amount, false, true);
      if (c.ncb_discount_amount > 0) addRow('NCB Discount', c.ncb_discount_amount, false, true);
    }

    // Totals
    y += 2;
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.3);
    doc.line(15, y, pageWidth - 15, y);
    y += 5;
    addRow('Net Premium', c.net_premium, true);
    addRow('CGST @9%', c.cgst);
    addRow('SGST @9%', c.sgst);
    y += 2;
    doc.setFillColor(0, 102, 204);
    doc.rect(15, y - 4, pageWidth - 30, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL PREMIUM', 20, y + 1);
    doc.text(fmt(c.total_premium), pageWidth - 20, y + 1, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 32, pageWidth - 15, pageHeight - 32);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('This is not a policy, It is a quotation which is valid upto 30 days only.', pageWidth / 2, pageHeight - 24, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bolditalic');
    doc.setTextColor(0, 102, 204);
    doc.text('Powered by BimaUncle.com', pageWidth - 20, pageHeight - 14, { align: 'right' });

    doc.save('Premium_Quotation.pdf');
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 0.5 }}>
          Premium Calculator
        </Typography>
        <Typography variant="body1" sx={{ color: '#6e6e73' }}>
          Calculate motor insurance premium with detailed breakdown
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        {/* Card 0: Customer Details */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            {sectionHeader(<PersonOutlined sx={{ color: '#0066CC' }} />, 'Customer Details')}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Customer Name" name="customer_name"
                  value={formData.customer_name} onChange={handleChange}
                  placeholder="e.g. John Doe" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Vehicle Registration No." name="registration_no"
                  value={formData.registration_no} onChange={handleChange}
                  placeholder="e.g. MH01AB1234" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Mobile No." name="mobile_no"
                  value={formData.mobile_no} onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData((prev) => ({ ...prev, mobile_no: val }));
                  }}
                  placeholder="e.g. 9876543210" inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 1: Vehicle Details */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            {sectionHeader(<DirectionsCarOutlined sx={{ color: '#0066CC' }} />, 'Vehicle Details')}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Policy Type</InputLabel>
                  <Select name="policy_type" value={formData.policy_type} label="Policy Type" onChange={handleChange}>
                    <MenuItem value="Package">Package</MenuItem>
                    <MenuItem value="Liability Only">Liability Only</MenuItem>
                    <MenuItem value="Own Damage Only">Own Damage Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select name="vehicle_type" value={formData.vehicle_type} label="Vehicle Type" onChange={handleChange}>
                    <MenuItem value="New">New</MenuItem>
                    <MenuItem value="Rollover">Rollover</MenuItem>
                    <MenuItem value="Used">Used</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Cubic Capacity</InputLabel>
                  <Select name="cc_category" value={formData.cc_category} label="Cubic Capacity" onChange={handleChange}>
                    <MenuItem value="upto_1000cc">Up to 1000cc</MenuItem>
                    <MenuItem value="1000cc_1500cc">1000cc – 1500cc</MenuItem>
                    <MenuItem value="above_1500cc">Above 1500cc</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Zone</InputLabel>
                  <Select name="zone" value={formData.zone} label="Zone" onChange={handleChange}>
                    <MenuItem value="A">Zone A</MenuItem>
                    <MenuItem value="B">Zone B</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="date" label="Purchase Date" name="purchase_date"
                  value={formData.purchase_date} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="date" label="Renewal Date" name="renewal_date"
                  value={formData.renewal_date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="number" label="IDV (₹)" name="idv"
                  value={formData.idv} onChange={handleChange} required />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 2: Discounts */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            {sectionHeader(<PercentOutlined sx={{ color: '#0066CC' }} />, 'Discounts')}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>NCB (%)</InputLabel>
                  <Select
                    name="ncb_percent"
                    value={formData.ncb_percent}
                    label="NCB (%)"
                    onChange={handleChange}
                  >
                    <MenuItem value={0}>0% (Default)</MenuItem>
                    <MenuItem value={20}>20%</MenuItem>
                    <MenuItem value={25}>25%</MenuItem>
                    <MenuItem value={35}>35%</MenuItem>
                    <MenuItem value={45}>45%</MenuItem>
                    <MenuItem value={50}>50%</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="number" label="OD Discount (%)" name="od_discount_percent"
                  value={formData.od_discount_percent} onChange={handleChange}
                  inputProps={{ min: 0, max: 100, step: 1 }}
                  helperText="Own Damage discount percentage" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 3: CNG/LPG */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            {sectionHeader(<LocalGasStationOutlined sx={{ color: '#0066CC' }} />, 'CNG/LPG Coverage')}
            <Grid container spacing={2.5} alignItems="center">
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={!!formData.builtin_cng_lpg} onChange={handleSwitchChange('builtin_cng_lpg')} color="primary" size="small" />}
                  label="Built-in CNG/LPG"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="number" label="CNG/LPG Sum Insured (₹)" name="cng_lpg_si"
                  value={formData.cng_lpg_si} onChange={handleChange}
                  disabled={!!formData.builtin_cng_lpg}
                  helperText={formData.builtin_cng_lpg ? "Not applicable for built-in CNG/LPG" : "For external CNG/LPG kit"} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 4: OD Add-ons */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            {sectionHeader(<SecurityOutlined sx={{ color: '#0066CC' }} />, 'Own Damage Add-ons')}
            <Grid container spacing={1.5}>
              {/* Nil Dep - with age+NCB rules */}
              <Grid item xs={12} sm={6} md={4}>
                <Tooltip title={nilDepMessage} placement="top" arrow disableHoverListener={!nilDepDisabled}>
                  <FormControlLabel
                    control={<Switch checked={!!formData.nil_dep} onChange={handleSwitchChange('nil_dep')} color="primary" size="small" disabled={nilDepDisabled} />}
                    label={<Typography variant="body2" color={nilDepDisabled ? 'text.disabled' : 'text.primary'}>Zero Depreciation</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Tooltip>
                {nilDepDisabled && <Typography variant="caption" color="error" sx={{ display: 'block', ml: 5.5, mt: -0.5 }}>{nilDepMessage}</Typography>}
              </Grid>
              {/* Return to Invoice - age > 2.5 restriction */}
              <Grid item xs={12} sm={6} md={4}>
                <Tooltip title={rtiMessage} placement="top" arrow disableHoverListener={!rtiDisabled}>
                  <FormControlLabel
                    control={<Switch checked={!!formData.return_to_invoice} onChange={handleSwitchChange('return_to_invoice')} color="primary" size="small" disabled={rtiDisabled} />}
                    label={<Typography variant="body2" color={rtiDisabled ? 'text.disabled' : 'text.primary'}>Return to Invoice</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Tooltip>
                {rtiDisabled && <Typography variant="caption" color="error" sx={{ display: 'block', ml: 5.5, mt: -0.5 }}>{rtiMessage}</Typography>}
              </Grid>
              {/* NCB Protect - only if NCB > 0 */}
              <Grid item xs={12} sm={6} md={4}>
                <Tooltip title={ncbProtectMessage} placement="top" arrow disableHoverListener={!ncbProtectDisabled}>
                  <FormControlLabel
                    control={<Switch checked={!!formData.ncb_protect} onChange={handleSwitchChange('ncb_protect')} color="primary" size="small" disabled={ncbProtectDisabled} />}
                    label={<Typography variant="body2" color={ncbProtectDisabled ? 'text.disabled' : 'text.primary'}>NCB Protect</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Tooltip>
                {ncbProtectDisabled && <Typography variant="caption" color="error" sx={{ display: 'block', ml: 5.5, mt: -0.5 }}>{ncbProtectMessage}</Typography>}
              </Grid>
              {/* Engine Protection - 4.5yr restriction */}
              <Grid item xs={12} sm={6} md={4}>
                <Tooltip title={over45Msg('Engine & Gearbox Protection - Platinum')} placement="top" arrow disableHoverListener={!over45Disabled}>
                  <FormControlLabel
                    control={<Switch checked={!!formData.engine_protection} onChange={handleSwitchChange('engine_protection')} color="primary" size="small" disabled={over45Disabled} />}
                    label={<Typography variant="body2" color={over45Disabled ? 'text.disabled' : 'text.primary'}>Engine & Gearbox Protection - Platinum</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Tooltip>
                {over45Disabled && <Typography variant="caption" color="error" sx={{ display: 'block', ml: 5.5, mt: -0.5 }}>{over45Msg('Engine & Gearbox Protection - Platinum')}</Typography>}
              </Grid>
              {/* Consumables - 4.5yr restriction */}
              <Grid item xs={12} sm={6} md={4}>
                <Tooltip title={over45Msg('Consumables')} placement="top" arrow disableHoverListener={!over45Disabled}>
                  <FormControlLabel
                    control={<Switch checked={!!formData.consumables} onChange={handleSwitchChange('consumables')} color="primary" size="small" disabled={over45Disabled} />}
                    label={<Typography variant="body2" color={over45Disabled ? 'text.disabled' : 'text.primary'}>Consumables</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Tooltip>
                {over45Disabled && <Typography variant="caption" color="error" sx={{ display: 'block', ml: 5.5, mt: -0.5 }}>{over45Msg('Consumables')}</Typography>}
              </Grid>
              {/* Unrestricted add-ons */}
              {[
                { name: 'road_side_assistance', label: 'Road Side Assistance' },
                { name: 'geo_extension', label: 'Geographical Extension' },
                { name: 'road_tax_cover', label: 'Road Tax Cover' },
                { name: 'courtesy_car', label: 'Courtesy Car (for 7 days)' },
                { name: 'additional_towing', label: 'Additional Towing' },
                { name: 'medical_expenses', label: 'Medical Expenses Option 2' },
              ].map((addon) => (
                <Grid item xs={12} sm={6} md={4} key={addon.name}>
                  <FormControlLabel
                    control={<Switch checked={!!formData[addon.name]} onChange={handleSwitchChange(addon.name)} color="primary" size="small" />}
                    label={<Typography variant="body2">{addon.label}</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Grid>
              ))}
              {/* Loss of Key - 4.5yr restriction */}
              <Grid item xs={12} sm={6} md={4}>
                <Tooltip title={over45Msg('Loss of Key (₹25k)')} placement="top" arrow disableHoverListener={!over45Disabled}>
                  <FormControlLabel
                    control={<Switch checked={!!formData.loss_of_key} onChange={handleSwitchChange('loss_of_key')} color="primary" size="small" disabled={over45Disabled} />}
                    label={<Typography variant="body2" color={over45Disabled ? 'text.disabled' : 'text.primary'}>Loss of Key (₹25k)</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Tooltip>
                {over45Disabled && <Typography variant="caption" color="error" sx={{ display: 'block', ml: 5.5, mt: -0.5 }}>{over45Msg('Loss of Key (₹25k)')}</Typography>}
              </Grid>
              {/* Personal Effects - 4.5yr restriction */}
              <Grid item xs={12} sm={6} md={4}>
                <Tooltip title={over45Msg('Personal Effects (₹10k)')} placement="top" arrow disableHoverListener={!over45Disabled}>
                  <FormControlLabel
                    control={<Switch checked={!!formData.personal_effects} onChange={handleSwitchChange('personal_effects')} color="primary" size="small" disabled={over45Disabled} />}
                    label={<Typography variant="body2" color={over45Disabled ? 'text.disabled' : 'text.primary'}>Personal Effects (₹10k)</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Tooltip>
                {over45Disabled && <Typography variant="caption" color="error" sx={{ display: 'block', ml: 5.5, mt: -0.5 }}>{over45Msg('Personal Effects (₹10k)')}</Typography>}
              </Grid>
              {/* Tyre & Rim SI Dropdown */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tyre & Rim Protector SI (₹)</InputLabel>
                  <Select name="tyre_rim_si" value={formData.tyre_rim_si} label="Tyre & Rim Protector SI (₹)" onChange={handleChange}>
                    <MenuItem value={0}>0 (Not Opted)</MenuItem>
                    <MenuItem value={25000}>₹25,000</MenuItem>
                    <MenuItem value={50000}>₹50,000</MenuItem>
                    <MenuItem value={100000}>₹1,00,000</MenuItem>
                    <MenuItem value={200000}>₹2,00,000</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {/* Road Tax SI - shown when road_tax_cover is enabled */}
              {!!formData.road_tax_cover && (
                <Grid item xs={12} sm={6} md={4}>
                  <TextField fullWidth size="small" type="number" label="Road Tax Cover – Sum Insured (₹)" name="road_tax_si"
                    value={formData.road_tax_si} onChange={handleChange}
                    helperText="Enter sum insured for road tax cover" />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Card 5: TP Add-ons */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            {sectionHeader(<GavelOutlined sx={{ color: '#0066CC' }} />, 'Third Party Add-ons')}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={<Switch checked={!!formData.cpa_owner_driver} onChange={handleSwitchChange('cpa_owner_driver')} color="primary" size="small" />}
                  label="CPA Owner Driver"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={<Switch checked={!!formData.ll_paid_driver} onChange={handleSwitchChange('ll_paid_driver')} color="primary" size="small" />}
                  label="LL to Paid Driver"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={<Switch checked={paUnnamedEnabled} onChange={handlePaUnnamedToggle} color="primary" size="small" />}
                  label="PA Cover – Unnamed Persons"
                />
              </Grid>
              {paUnnamedEnabled && (
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField fullWidth size="small" type="number" label="Number of Persons" name="pa_unnamed_persons"
                      value={formData.pa_unnamed_persons} onChange={handleChange}
                      inputProps={{ min: 1 }} helperText="Enter number of persons (min 1)" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Capital SI per Person (₹)</InputLabel>
                      <Select name="pa_unnamed_si" value={formData.pa_unnamed_si} label="Capital SI per Person (₹)" onChange={handleChange}>
                        <MenuItem value={50000}>₹50,000</MenuItem>
                        <MenuItem value={100000}>₹1,00,000</MenuItem>
                        <MenuItem value={150000}>₹1,50,000</MenuItem>
                        <MenuItem value={200000}>₹2,00,000</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CalculateOutlined />}
            sx={{ flex: 1, py: 1.5, fontSize: '1rem', minWidth: 180 }}
          >
            {loading ? 'Calculating…' : 'Calculate Premium'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={handleReset}
            startIcon={<RestartAltOutlined />}
            sx={{
              px: 4, py: 1.5,
              borderColor: '#d2d2d7', color: '#6e6e73',
              '&:hover': { borderColor: '#86868b', bgcolor: 'rgba(0,0,0,0.02)' },
            }}
          >
            Reset
          </Button>
          {result && (
            <>
              <Button
                variant="outlined"
                size="large"
                onClick={generatePDF}
                startIcon={<PictureAsPdfOutlined />}
                sx={{
                  px: 4, py: 1.5,
                  borderColor: '#FF3B30', color: '#FF3B30',
                  '&:hover': { borderColor: '#CC2D26', bgcolor: 'rgba(255,59,48,0.04)' },
                }}
              >
                Export PDF
              </Button>
              <FormControlLabel
                control={<Switch checked={showDiscountInPDF} onChange={(e) => setShowDiscountInPDF(e.target.checked)} color="primary" size="small" />}
                label={<Typography variant="body2" sx={{ color: '#6e6e73' }}>Show Discount in PDF</Typography>}
                sx={{ ml: 0 }}
              />
            </>
          )}
        </Box>
      </form>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}

      {result && (
        <Box>
          {/* Hero Total Card */}
          <Card sx={{
            mb: 3, borderRadius: '16px', overflow: 'hidden',
            background: 'linear-gradient(135deg, #0066CC 0%, #004C99 100%)',
            color: '#fff',
          }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.85, mb: 1, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                Total Premium
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {formatCurrency(result.calculations.total_premium)}
              </Typography>
              <Chip label="Inclusive of GST" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', mt: 1 }} />
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ ...cardSx, mb: 0 }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net Premium</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1d1d1f', mt: 0.5 }}>
                    {formatCurrency(result.calculations.net_premium)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ ...cardSx, mb: 0 }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CGST (9%)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1d1d1f', mt: 0.5 }}>
                    {formatCurrency(result.calculations.cgst)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ ...cardSx, mb: 0 }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SGST (9%)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1d1d1f', mt: 0.5 }}>
                    {formatCurrency(result.calculations.sgst)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Breakdown */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: 0 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer' }}
                onClick={() => setBreakdownOpen(!breakdownOpen)}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Detailed Breakdown</Typography>
                <IconButton size="small">{breakdownOpen ? <ExpandLess /> : <ExpandMore />}</IconButton>
              </Box>
              <Collapse in={breakdownOpen}>
                <Divider />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#6e6e73', fontSize: '0.75rem' }}>REF</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#6e6e73', fontSize: '0.75rem' }}>FIELD</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#6e6e73', fontSize: '0.75rem' }}>VALUE</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Vehicle Age & OD Rate */}
                      <TableRow><TableCell colSpan={3} sx={{ bgcolor: '#f5f5f7', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Vehicle Age & OD Rate</TableCell></TableRow>
                      <TableRow><TableCell>AA</TableCell><TableCell>Age of vehicle</TableCell><TableCell align="right">{Number(result.calculations.age_years).toFixed(2)} years</TableCell></TableRow>
                      <TableRow><TableCell>AB</TableCell><TableCell>OD Basic Rate</TableCell><TableCell align="right">{result.calculations.od_base_rate_percent}%</TableCell></TableRow>
                      <TableRow><TableCell>AC</TableCell><TableCell>Basic OD Premium</TableCell><TableCell align="right">{formatCurrency(result.calculations.basic_od_premium)}</TableCell></TableRow>

                      {/* OD Add-on Premiums */}
                      <TableRow><TableCell colSpan={3} sx={{ bgcolor: '#f5f5f7', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>OD Add-on Premiums</TableCell></TableRow>
                      <TableRow><TableCell>AD</TableCell><TableCell>Nil Depreciation</TableCell><TableCell align="right">{formatCurrency(result.calculations.nil_dep_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AE</TableCell><TableCell>Engine & Gearbox Protection</TableCell><TableCell align="right">{formatCurrency(result.calculations.engine_protection_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AF</TableCell><TableCell>Road Side Assistance</TableCell><TableCell align="right">{formatCurrency(result.calculations.road_side_assistance_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AG</TableCell><TableCell>Return to Invoice</TableCell><TableCell align="right">{formatCurrency(result.calculations.return_to_invoice_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AH</TableCell><TableCell>NCB Protect</TableCell><TableCell align="right">{formatCurrency(result.calculations.ncb_protect_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AI</TableCell><TableCell>Consumables</TableCell><TableCell align="right">{formatCurrency(result.calculations.consumables_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AJ</TableCell><TableCell>Geographical Extension OD</TableCell><TableCell align="right">{formatCurrency(result.calculations.geo_extension_od_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AK</TableCell><TableCell>Built-in CNG/LPG OD</TableCell><TableCell align="right">{formatCurrency(result.calculations.builtin_cng_od_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AL</TableCell><TableCell>CNG/LPG OD</TableCell><TableCell align="right">{formatCurrency(result.calculations.cng_lpg_od_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AM</TableCell><TableCell>Loss of Key</TableCell><TableCell align="right">{formatCurrency(result.calculations.loss_of_key_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AN</TableCell><TableCell>Additional Towing</TableCell><TableCell align="right">{formatCurrency(result.calculations.towing_charges_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AO</TableCell><TableCell>Medical Expenses</TableCell><TableCell align="right">{formatCurrency(result.calculations.medical_expenses_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AP</TableCell><TableCell>Tyre & RIM Protector</TableCell><TableCell align="right">{formatCurrency(result.calculations.tyre_rim_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AQ</TableCell><TableCell>Personal Effects</TableCell><TableCell align="right">{formatCurrency(result.calculations.personal_effects_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AR</TableCell><TableCell>Courtesy Car</TableCell><TableCell align="right">{formatCurrency(result.calculations.courtesy_car_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AS</TableCell><TableCell>Road Tax</TableCell><TableCell align="right">{formatCurrency(result.calculations.road_tax_premium)}</TableCell></TableRow>

                      {/* TP Premiums */}
                      <TableRow><TableCell colSpan={3} sx={{ bgcolor: '#f5f5f7', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>TP Premiums</TableCell></TableRow>
                      <TableRow><TableCell>AT</TableCell><TableCell>Basic TP</TableCell><TableCell align="right">{formatCurrency(result.calculations.basic_tp_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AU</TableCell><TableCell>CPA Owner Driver (SI – ₹15L)</TableCell><TableCell align="right">{formatCurrency(result.calculations.cpa_owner_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AV</TableCell><TableCell>LL to Paid Driver</TableCell><TableCell align="right">{formatCurrency(result.calculations.ll_paid_driver_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AW</TableCell><TableCell>CNG/LPG TP</TableCell><TableCell align="right">{formatCurrency(result.calculations.cng_lpg_tp_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AX</TableCell><TableCell>Geographical Extension TP</TableCell><TableCell align="right">{formatCurrency(result.calculations.geo_extension_tp_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AX2</TableCell><TableCell>PA Cover – Unnamed Persons</TableCell><TableCell align="right">{formatCurrency(result.calculations.pa_unnamed_premium)}</TableCell></TableRow>

                      {/* Discounts & Final */}
                      <TableRow><TableCell colSpan={3} sx={{ bgcolor: '#f5f5f7', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Discounts & Final</TableCell></TableRow>
                      <TableRow><TableCell>AY</TableCell><TableCell>OD Discount</TableCell><TableCell align="right" sx={{ color: '#FF3B30' }}>-{formatCurrency(result.calculations.od_discount_amount)}</TableCell></TableRow>
                      <TableRow><TableCell>AZ</TableCell><TableCell>NCB Discount</TableCell><TableCell align="right" sx={{ color: '#FF3B30' }}>-{formatCurrency(result.calculations.ncb_discount_amount)}</TableCell></TableRow>
                      <TableRow><TableCell>BA</TableCell><TableCell sx={{ fontWeight: 600 }}>Net Premium</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(result.calculations.net_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>BB</TableCell><TableCell>CGST @9%</TableCell><TableCell align="right">{formatCurrency(result.calculations.cgst)}</TableCell></TableRow>
                      <TableRow><TableCell>BC</TableCell><TableCell>SGST @9%</TableCell><TableCell align="right">{formatCurrency(result.calculations.sgst)}</TableCell></TableRow>
                      <TableRow sx={{ bgcolor: 'rgba(0,102,204,0.06)' }}>
                        <TableCell>BD</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>TOTAL PREMIUM</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0066CC' }}>{formatCurrency(result.calculations.total_premium)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default CompleteCalculator;
