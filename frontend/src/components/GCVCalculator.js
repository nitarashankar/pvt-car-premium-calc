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
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
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
  vehicle_type: 'Preowned',
  gvw: 7500,
  zone: 'C',
  purchase_date: '2024-01-01',
  renewal_date: getTomorrowDate(),
  idv: 750000,
  ncb_percent: 0,
  od_discount_percent: 0,
  builtin_cng_lpg: 0,
  cng_lpg_si: 0,
  nil_dep: 0,
  return_to_invoice: 0,
  consumables: 0,
  road_side_assistance: 0,
  additional_towing: 0,
  additional_towing_si: 0,
  imt23_cover: 0,
  electrical_accessories_si: 0,
  non_electrical_accessories_si: 0,
  cpa_owner_driver: 1,
  ll_paid_driver: 1,
  nfpp: 0,
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

const GCVCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [showDiscountInPDF, setShowDiscountInPDF] = useState(true);

  const vehicleAge = useMemo(() => getVehicleAge(formData.purchase_date, formData.renewal_date), [formData.purchase_date, formData.renewal_date]);
  const ncbValue = Number(formData.ncb_percent) || 0;

  // Nil Dep rules - same as PVT car
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

  // Return to Invoice rule
  const rtiDisabled = vehicleAge > 2.5;
  const rtiMessage = rtiDisabled ? 'Return to invoice cover is not allowed for vehicles more than 2.5 years old.' : '';

  // 4.5yr restrictions
  const over45Disabled = vehicleAge > 4.5;
  const over45Msg = (name) => over45Disabled ? `${name} cover is not allowed for vehicles more than 4.5 years old.` : '';

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target.checked ? 1 : 0) : value,
      };
      if (name === 'purchase_date' || name === 'renewal_date') {
        const newAge = getVehicleAge(
          name === 'purchase_date' ? value : prev.purchase_date,
          name === 'renewal_date' ? value : prev.renewal_date
        );
        const newNcb = Number(prev.ncb_percent) || 0;
        if (newAge > 6.5 || (newAge > 4.5 && newNcb < 25)) {
          updated.nil_dep = 0;
        }
        if (newAge > 2.5) {
          updated.return_to_invoice = 0;
        }
        if (newAge > 4.5) {
          updated.consumables = 0;
        }
      }
      if (name === 'ncb_percent') {
        const newNcb = Number(value) || 0;
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
      if (name === 'builtin_cng_lpg' && newVal === 1) {
        updated.cng_lpg_si = 0;
      }
      if (name === 'additional_towing' && newVal === 0) {
        updated.additional_towing_si = 0;
      }
      return updated;
    });
  };

  const handleReset = () => {
    setFormData({ ...defaultFormData });
    setResult(null);
    setError(null);
  };

  const validate = () => {
    if (!formData.gvw || Number(formData.gvw) <= 0) return 'GVW is required and must be greater than 0';
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
      const response = await calculatorAPI.calculateGCVPremium(formData);
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

    // Header
    doc.setFillColor(0, 102, 204);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('GCV Insurance Premium Quotation', pageWidth / 2, 18, { align: 'center' });
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

    // Vehicle Details
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
      ['GVW', `${Number(formData.gvw).toLocaleString('en-IN')} kg`],
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
    if (c.electrical_accessories_premium > 0) addRow('Electrical Accessories', c.electrical_accessories_premium);
    if (c.non_electrical_accessories_premium > 0) addRow('Non-Electrical Accessories', c.non_electrical_accessories_premium);
    if (c.nil_dep_premium > 0) addRow('Zero Depreciation', c.nil_dep_premium);
    if (c.road_side_assistance_premium > 0) addRow('Road Side Assistance', c.road_side_assistance_premium);
    if (c.return_to_invoice_premium > 0) addRow('Return to Invoice', c.return_to_invoice_premium);
    if (c.consumables_premium > 0) addRow('Consumables', c.consumables_premium);
    if (c.builtin_cng_od_premium > 0) addRow('Built-in CNG/LPG OD', c.builtin_cng_od_premium);
    if (c.cng_lpg_od_premium > 0) addRow('CNG/LPG OD', c.cng_lpg_od_premium);
    if (c.towing_charges_premium > 0) addRow('Additional Towing Charges', c.towing_charges_premium);
    if (c.imt23_premium > 0) addRow('IMT 23 Cover', c.imt23_premium);

    // TP Premiums
    addSection('THIRD PARTY PREMIUMS');
    addRow('Basic TP Premium', c.basic_tp_premium);
    if (c.cpa_owner_premium > 0) addRow('CPA Owner Driver (SI - Rs.15L)', c.cpa_owner_premium);
    if (c.ll_paid_driver_premium > 0) addRow('LL to Paid Driver', c.ll_paid_driver_premium);
    if (c.cng_lpg_tp_premium > 0) addRow('CNG/LPG TP', c.cng_lpg_tp_premium);

    // Discounts
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
    addRow('Net OD Premium', c.net_od_premium, true);
    addRow('Net TP Premium', c.net_tp_premium, true);
    addRow('IGST on OD @18%', c.igst_od);
    addRow('IGST on TP @5%', c.igst_tp);
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

    doc.save('GCV_Premium_Quotation.pdf');
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 0.5 }}>
          GCV Premium Calculator
        </Typography>
        <Typography variant="body1" sx={{ color: '#6e6e73' }}>
          Calculate Goods Carrying Vehicle insurance premium with detailed breakdown
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
            {sectionHeader(<LocalShippingOutlined sx={{ color: '#0066CC' }} />, 'Vehicle Details')}
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
                    <MenuItem value="Preowned">Preowned</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="number" label="GVW (kg)" name="gvw"
                  value={formData.gvw} onChange={handleChange} required
                  helperText="Gross Vehicle Weight in kg" />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Zone</InputLabel>
                  <Select name="zone" value={formData.zone} label="Zone" onChange={handleChange}>
                    <MenuItem value="A">Zone A</MenuItem>
                    <MenuItem value="B">Zone B</MenuItem>
                    <MenuItem value="C">Zone C</MenuItem>
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
              {/* Vehicle Age Display */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Vehicle Age" value={`${vehicleAge.toFixed(2)} years`}
                  InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f5f5f7' } }} />
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
                  <Select name="ncb_percent" value={formData.ncb_percent} label="NCB (%)" onChange={handleChange}>
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

        {/* Card 4: Accessories */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            {sectionHeader(<SecurityOutlined sx={{ color: '#0066CC' }} />, 'Accessories')}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="number" label="Electrical Accessories SI (₹)" name="electrical_accessories_si"
                  value={formData.electrical_accessories_si} onChange={handleChange}
                  helperText="Sum insured for electrical accessories" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="number" label="Non-Electrical Accessories SI (₹)" name="non_electrical_accessories_si"
                  value={formData.non_electrical_accessories_si} onChange={handleChange}
                  helperText="Sum insured for non-electrical accessories" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 5: OD Add-ons */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            {sectionHeader(<SecurityOutlined sx={{ color: '#0066CC' }} />, 'Own Damage Add-ons')}
            <Grid container spacing={1.5}>
              {/* Nil Dep */}
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
              {/* Return to Invoice */}
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
              {/* Consumables */}
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
              {/* Road Side Assistance */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={<Switch checked={!!formData.road_side_assistance} onChange={handleSwitchChange('road_side_assistance')} color="primary" size="small" />}
                  label={<Typography variant="body2">Road Side Assistance</Typography>}
                  sx={{ ml: 0 }}
                />
              </Grid>
              {/* Additional Towing */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={<Switch checked={!!formData.additional_towing} onChange={handleSwitchChange('additional_towing')} color="primary" size="small" />}
                  label={<Typography variant="body2">Additional Towing Charges</Typography>}
                  sx={{ ml: 0 }}
                />
              </Grid>
              {/* IMT 23 Cover */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={<Switch checked={!!formData.imt23_cover} onChange={handleSwitchChange('imt23_cover')} color="primary" size="small" />}
                  label={<Typography variant="body2">IMT 23 Cover</Typography>}
                  sx={{ ml: 0 }}
                />
              </Grid>
              {/* NFPP */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={<Switch checked={!!formData.nfpp} onChange={handleSwitchChange('nfpp')} color="primary" size="small" />}
                  label={<Typography variant="body2">NFPP (No Fault Personal Protection)</Typography>}
                  sx={{ ml: 0 }}
                />
              </Grid>
              {/* Additional Towing SI - shown when enabled */}
              {!!formData.additional_towing && (
                <Grid item xs={12} sm={6} md={4}>
                  <TextField fullWidth size="small" type="number" label="Towing Charges SI (₹)" name="additional_towing_si"
                    value={formData.additional_towing_si} onChange={handleChange}
                    helperText="Sum insured for additional towing" />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Card 6: TP Add-ons */}
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
                <TextField fullWidth size="small" type="number" label="LL to Paid Driver (Count)" name="ll_paid_driver"
                  value={formData.ll_paid_driver} onChange={handleChange}
                  inputProps={{ min: 0 }}
                  helperText="Number of paid drivers (₹50 each)" />
              </Grid>
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
            <Grid item xs={6} sm={3}>
              <Card sx={{ ...cardSx, mb: 0 }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net OD</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d1d1f', mt: 0.5 }}>
                    {formatCurrency(result.calculations.net_od_premium)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ ...cardSx, mb: 0 }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net TP</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d1d1f', mt: 0.5 }}>
                    {formatCurrency(result.calculations.net_tp_premium)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ ...cardSx, mb: 0 }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IGST OD (18%)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d1d1f', mt: 0.5 }}>
                    {formatCurrency(result.calculations.igst_od)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ ...cardSx, mb: 0 }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IGST TP (5%)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d1d1f', mt: 0.5 }}>
                    {formatCurrency(result.calculations.igst_tp)}
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
                      <TableRow><TableCell>W</TableCell><TableCell>Age of vehicle</TableCell><TableCell align="right">{Number(result.calculations.age_years).toFixed(2)} years</TableCell></TableRow>
                      <TableRow><TableCell>X</TableCell><TableCell>OD Basic Rate</TableCell><TableCell align="right">{result.calculations.od_base_rate_percent}%</TableCell></TableRow>
                      <TableRow><TableCell>Y</TableCell><TableCell>Basic OD Premium</TableCell><TableCell align="right">{formatCurrency(result.calculations.basic_od_premium)}</TableCell></TableRow>

                      {/* OD Add-on Premiums */}
                      <TableRow><TableCell colSpan={3} sx={{ bgcolor: '#f5f5f7', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>OD Add-on Premiums</TableCell></TableRow>
                      <TableRow><TableCell>Z</TableCell><TableCell>Nil Depreciation</TableCell><TableCell align="right">{formatCurrency(result.calculations.nil_dep_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AA</TableCell><TableCell>Road Side Assistance</TableCell><TableCell align="right">{formatCurrency(result.calculations.road_side_assistance_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AB</TableCell><TableCell>Return to Invoice</TableCell><TableCell align="right">{formatCurrency(result.calculations.return_to_invoice_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AC</TableCell><TableCell>Consumables</TableCell><TableCell align="right">{formatCurrency(result.calculations.consumables_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AD</TableCell><TableCell>Built-in CNG/LPG OD</TableCell><TableCell align="right">{formatCurrency(result.calculations.builtin_cng_od_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AE</TableCell><TableCell>CNG/LPG OD</TableCell><TableCell align="right">{formatCurrency(result.calculations.cng_lpg_od_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AF</TableCell><TableCell>Additional Towing Charges</TableCell><TableCell align="right">{formatCurrency(result.calculations.towing_charges_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AG</TableCell><TableCell>IMT 23 Cover</TableCell><TableCell align="right">{formatCurrency(result.calculations.imt23_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AH</TableCell><TableCell>Electrical Accessories</TableCell><TableCell align="right">{formatCurrency(result.calculations.electrical_accessories_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AI</TableCell><TableCell>Non-Electrical Accessories</TableCell><TableCell align="right">{formatCurrency(result.calculations.non_electrical_accessories_premium)}</TableCell></TableRow>

                      {/* TP Premiums */}
                      <TableRow><TableCell colSpan={3} sx={{ bgcolor: '#f5f5f7', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>TP Premiums</TableCell></TableRow>
                      <TableRow><TableCell>AJ</TableCell><TableCell>Basic TP</TableCell><TableCell align="right">{formatCurrency(result.calculations.basic_tp_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AK</TableCell><TableCell>CPA Owner Driver (SI – ₹15L)</TableCell><TableCell align="right">{formatCurrency(result.calculations.cpa_owner_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AL</TableCell><TableCell>LL to Paid Driver</TableCell><TableCell align="right">{formatCurrency(result.calculations.ll_paid_driver_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AM</TableCell><TableCell>CNG/LPG TP</TableCell><TableCell align="right">{formatCurrency(result.calculations.cng_lpg_tp_premium)}</TableCell></TableRow>

                      {/* Discounts & Final */}
                      <TableRow><TableCell colSpan={3} sx={{ bgcolor: '#f5f5f7', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Discounts & Final</TableCell></TableRow>
                      <TableRow><TableCell>AN</TableCell><TableCell>OD Discount</TableCell><TableCell align="right" sx={{ color: '#FF3B30' }}>-{formatCurrency(result.calculations.od_discount_amount)}</TableCell></TableRow>
                      <TableRow><TableCell>AO</TableCell><TableCell>NCB Discount</TableCell><TableCell align="right" sx={{ color: '#FF3B30' }}>-{formatCurrency(result.calculations.ncb_discount_amount)}</TableCell></TableRow>
                      <TableRow><TableCell>AP</TableCell><TableCell sx={{ fontWeight: 600 }}>Net OD Premium</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(result.calculations.net_od_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AQ</TableCell><TableCell sx={{ fontWeight: 600 }}>Net TP Premium</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(result.calculations.net_tp_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AR</TableCell><TableCell>IGST on OD @18%</TableCell><TableCell align="right">{formatCurrency(result.calculations.igst_od)}</TableCell></TableRow>
                      <TableRow><TableCell>AS</TableCell><TableCell>IGST on TP @5%</TableCell><TableCell align="right">{formatCurrency(result.calculations.igst_tp)}</TableCell></TableRow>
                      <TableRow sx={{ bgcolor: 'rgba(0,102,204,0.06)' }}>
                        <TableCell>AT</TableCell>
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

export default GCVCalculator;
