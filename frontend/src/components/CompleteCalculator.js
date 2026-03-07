import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Switch, FormControlLabel, Button,
  CircularProgress, Alert, Grid, Chip, Collapse, IconButton, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
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
import calculatorAPI from '../services/api';

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getVehicleAgeYears = (purchaseDate) => {
  if (!purchaseDate) return 0;
  const now = new Date();
  const purchase = new Date(purchaseDate);
  return (now - purchase) / (365.25 * 24 * 60 * 60 * 1000);
};

const defaultFormData = {
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
  courtesy_car: 0,
  additional_towing: 0,
  medical_expenses: 0,
  loss_of_key: 0,
  tyre_rim_si: 0,
  personal_effects: 0,
  cpa_owner_driver: 1,
  ll_paid_driver: 1,
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

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
      };
      // Auto-enable Nil Dep if vehicle age < 5 years based on purchase date
      if (name === 'purchase_date' && value) {
        const ageYears = getVehicleAgeYears(value);
        updated.nil_dep = ageYears < 5 ? 1 : 0;
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
      return updated;
    });
  };

  const handleReset = () => {
    setFormData({ ...defaultFormData });
    setResult(null);
    setError(null);
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
              {[
                { name: 'nil_dep', label: 'Zero Depreciation' },
                { name: 'return_to_invoice', label: 'Return to Invoice' },
                { name: 'ncb_protect', label: 'NCB Protect' },
                { name: 'engine_protection', label: 'Engine & Gearbox Protection - Platinum' },
                { name: 'consumables', label: 'Consumables' },
                { name: 'road_side_assistance', label: 'Road Side Assistance' },
                { name: 'geo_extension', label: 'Geographical Extension' },
                { name: 'road_tax_cover', label: 'Road Tax Cover' },
                { name: 'courtesy_car', label: 'Courtesy Car (for 7 days)' },
                { name: 'additional_towing', label: 'Additional Towing' },
                { name: 'medical_expenses', label: 'Medical Expenses Option 2' },
                { name: 'loss_of_key', label: 'Loss of Key (₹25k)' },
                { name: 'personal_effects', label: 'Personal Effects (₹10k)' },
              ].map((addon) => (
                <Grid item xs={12} sm={6} md={4} key={addon.name}>
                  <FormControlLabel
                    control={<Switch checked={!!formData[addon.name]} onChange={handleSwitchChange(addon.name)} color="primary" size="small" />}
                    label={<Typography variant="body2">{addon.label}</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="number" label="Tyre & RIM Protector SI (₹)" name="tyre_rim_si"
                  value={formData.tyre_rim_si} onChange={handleChange} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 5: TP Add-ons */}
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            {sectionHeader(<GavelOutlined sx={{ color: '#0066CC' }} />, 'Third Party Add-ons')}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={!!formData.cpa_owner_driver} onChange={handleSwitchChange('cpa_owner_driver')} color="primary" size="small" />}
                  label="CPA Owner Driver"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={!!formData.ll_paid_driver} onChange={handleSwitchChange('ll_paid_driver')} color="primary" size="small" />}
                  label="LL to Paid Driver"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CalculateOutlined />}
            sx={{ flex: 1, py: 1.5, fontSize: '1rem' }}
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
                      <TableRow><TableCell>AA</TableCell><TableCell>Age of vehicle</TableCell><TableCell align="right">{result.calculations.age_years} years</TableCell></TableRow>
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
                      <TableRow><TableCell>AU</TableCell><TableCell>CPA Owner Driver</TableCell><TableCell align="right">{formatCurrency(result.calculations.cpa_owner_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AV</TableCell><TableCell>LL to Paid Driver</TableCell><TableCell align="right">{formatCurrency(result.calculations.ll_paid_driver_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AW</TableCell><TableCell>CNG/LPG TP</TableCell><TableCell align="right">{formatCurrency(result.calculations.cng_lpg_tp_premium)}</TableCell></TableRow>
                      <TableRow><TableCell>AX</TableCell><TableCell>Geographical Extension TP</TableCell><TableCell align="right">{formatCurrency(result.calculations.geo_extension_tp_premium)}</TableCell></TableRow>

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
