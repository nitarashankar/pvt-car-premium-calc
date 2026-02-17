import React, { useState } from 'react';
import {
  Paper, Grid, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Typography, Box, Card, CardContent, Divider, Alert,
  FormControlLabel, Checkbox, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import calculatorAPI from '../services/api';

const CompleteCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // All 26 input fields exactly as in Excel (Columns A-Z)
  const [formData, setFormData] = useState({
    // A - Policy Type
    policy_type: 'Package',
    // B - Type of Vehicle
    vehicle_type: 'New',
    // C - Cubic Capacity
    cc_category: '1000cc_1500cc',
    // D - Zone
    zone: 'A',
    // E - Date of purchase
    purchase_date: '2024-01-01',
    // F - IDV
    idv: 125000,
    // G - NCB
    ncb_percent: 0,
    // H - OD Discount
    od_discount_percent: 0,
    // I - Built in CNG/LPG
    builtin_cng_lpg: 0,
    // J - CNG/LPG SI
    cng_lpg_si: 0,
    // K - Nil Dep
    nil_dep: 0,
    // L - Return to Invoice
    return_to_invoice: 0,
    // M - NCB Protect
    ncb_protect: 0,
    // N - Engine and Gearbox Protection
    engine_protection: 0,
    // O - Consumables
    consumables: 0,
    // P - Road Side Assistance
    road_side_assistance: 0,
    // Q - Geographical Area Extension
    geo_extension: 0,
    // R - Road Tax Cover (SI- IDV*20%)
    road_tax_cover: 0,
    // S - Courtesy Car Cover
    courtesy_car: 0,
    // T - Additional Towing Charges
    additional_towing: 0,
    // U - Medical Expenses
    medical_expenses: 0,
    // V - Loss of Key (SI - 25k)
    loss_of_key: 0,
    // W - Tyre and RIM protector
    tyre_rim_si: 0,
    // X - Personal Effects (SI - 10k)
    personal_effects: 0,
    // Y - CPA owner Driver
    cpa_owner_driver: 0,
    // Z - LL to paid Driver
    ll_paid_driver: 0,
  });

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await calculatorAPI.calculatePremium(formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        Complete Premium Calculator (All 86 Excel Fields)
      </Typography>
      <Typography variant="subtitle1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
        This calculator implements all 86 fields from Excel exactly: 26 inputs (A-Z), 30 calculations (AA-BD), 30 display (BE-CH)
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Section 1: Basic Information (Columns A-F) */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary">Section 1: Basic Vehicle Information</Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>A - Policy Type</InputLabel>
              <Select name="policy_type" value={formData.policy_type} onChange={handleChange}>
                <MenuItem value="Package">Package</MenuItem>
                <MenuItem value="Liability Only">Liability Only</MenuItem>
                <MenuItem value="Own Damage Only">Own Damage Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>B - Type of Vehicle</InputLabel>
              <Select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange}>
                <MenuItem value="New">New</MenuItem>
                <MenuItem value="Rollover">Rollover</MenuItem>
                <MenuItem value="Used">Used</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>C - Cubic Capacity</InputLabel>
              <Select name="cc_category" value={formData.cc_category} onChange={handleChange} required>
                <MenuItem value="upto_1000cc">Upto 1000cc</MenuItem>
                <MenuItem value="1000cc_1500cc">1000cc - 1500cc</MenuItem>
                <MenuItem value="above_1500cc">Above 1500cc</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>D - Zone</InputLabel>
              <Select name="zone" value={formData.zone} onChange={handleChange} required>
                <MenuItem value="A">Zone A</MenuItem>
                <MenuItem value="B">Zone B</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="E - Date of Purchase"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="F - IDV (₹)"
              name="idv"
              value={formData.idv}
              onChange={handleChange}
              required
            />
          </Grid>

          {/* Section 2: Discounts (Columns G-H) */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" color="primary">Section 2: Discounts</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="G - NCB (%)"
              name="ncb_percent"
              value={formData.ncb_percent}
              onChange={handleChange}
              inputProps={{ min: 0, max: 50, step: 1 }}
              helperText="Enter NCB as % (e.g., 20 for 20%)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="H - OD Discount (%)"
              name="od_discount_percent"
              value={formData.od_discount_percent}
              onChange={handleChange}
              inputProps={{ min: 0, max: 100, step: 1 }}
              helperText="Enter OD Discount as % (e.g., 60 for 60%)"
            />
          </Grid>

          {/* Section 3: CNG/LPG (Columns I-J) */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" color="primary">Section 3: CNG/LPG Coverage</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox 
                  name="builtin_cng_lpg" 
                  checked={!!formData.builtin_cng_lpg} 
                  onChange={handleChange} 
                />
              }
              label="I - Built in CNG/LPG"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="J - CNG/LPG SI (₹)"
              name="cng_lpg_si"
              value={formData.cng_lpg_si}
              onChange={handleChange}
              helperText="For external CNG kit - enter Sum Insured"
            />
          </Grid>

          {/* Section 4: OD Add-ons (Columns K-W) */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" color="primary">Section 4: OD Add-on Covers</Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="nil_dep" checked={!!formData.nil_dep} onChange={handleChange} />}
              label="K - Zero Depreciation"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="return_to_invoice" checked={!!formData.return_to_invoice} onChange={handleChange} />}
              label="L - Return to Invoice"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="ncb_protect" checked={!!formData.ncb_protect} onChange={handleChange} />}
              label="M - NCB Protect"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="engine_protection" checked={!!formData.engine_protection} onChange={handleChange} />}
              label="N - Engine & Gearbox Protection"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="consumables" checked={!!formData.consumables} onChange={handleChange} />}
              label="O - Consumables"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="road_side_assistance" checked={!!formData.road_side_assistance} onChange={handleChange} />}
              label="P - Road Side Assistance"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="geo_extension" checked={!!formData.geo_extension} onChange={handleChange} />}
              label="Q - Geographical Extension"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="road_tax_cover" checked={!!formData.road_tax_cover} onChange={handleChange} />}
              label="R - Road Tax Cover"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="courtesy_car" checked={!!formData.courtesy_car} onChange={handleChange} />}
              label="S - Courtesy Car"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="additional_towing" checked={!!formData.additional_towing} onChange={handleChange} />}
              label="T - Additional Towing"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="medical_expenses" checked={!!formData.medical_expenses} onChange={handleChange} />}
              label="U - Medical Expenses"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="loss_of_key" checked={!!formData.loss_of_key} onChange={handleChange} />}
              label="V - Loss of Key (₹25k)"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="W - Tyre & RIM Protector SI (₹)"
              name="tyre_rim_si"
              value={formData.tyre_rim_si}
              onChange={handleChange}
              helperText="Enter Sum Insured amount"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="personal_effects" checked={!!formData.personal_effects} onChange={handleChange} />}
              label="X - Personal Effects (₹10k)"
            />
          </Grid>

          {/* Section 5: TP Add-ons (Columns Y-Z) */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" color="primary">Section 5: TP Add-on Covers</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Checkbox name="cpa_owner_driver" checked={!!formData.cpa_owner_driver} onChange={handleChange} />}
              label="Y - CPA Owner Driver"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Checkbox name="ll_paid_driver" checked={!!formData.ll_paid_driver} onChange={handleChange} />}
              label="Z - LL to Paid Driver"
            />
          </Grid>

          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              fullWidth
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Calculate Premium (All 86 Fields)'}
            </Button>
          </Grid>
        </Grid>
      </form>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {JSON.stringify(error)}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 4 }}>
          {/* Summary Card */}
          <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" align="center">
                Total Premium: ₹{result.calculations.total_premium.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">Net Premium</Typography>
                  <Typography variant="h6">₹{result.calculations.net_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">CGST (9%)</Typography>
                  <Typography variant="h6">₹{result.calculations.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">SGST (9%)</Typography>
                  <Typography variant="h6">₹{result.calculations.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Complete Breakdown Table */}
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Complete Calculation Breakdown (All 60 Calculated Fields)</Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Columns AA-BD (30 Primary Calculations) + BE-CH (30 Display Fields)
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Excel Column</strong></TableCell>
                      <TableCell><strong>Field Name</strong></TableCell>
                      <TableCell align="right"><strong>Value</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Age and Basic OD */}
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell colSpan={3}><strong>Vehicle Age & OD Rate</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AA</TableCell>
                      <TableCell>Age of vehicle in years</TableCell>
                      <TableCell align="right">{result.calculations.age_years} years</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AB</TableCell>
                      <TableCell>OD Basic Rate</TableCell>
                      <TableCell align="right">{result.calculations.od_base_rate_percent}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AC</TableCell>
                      <TableCell>Basic OD Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.basic_od_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>

                    {/* OD Add-ons */}
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell colSpan={3}><strong>OD Add-on Premiums</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AD</TableCell>
                      <TableCell>Nil Depreciation Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.nil_dep_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AE</TableCell>
                      <TableCell>Engine & Gearbox Protection Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.engine_protection_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AF</TableCell>
                      <TableCell>Road Side Assistance</TableCell>
                      <TableCell align="right">₹{result.calculations.road_side_assistance_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AG</TableCell>
                      <TableCell>Return to Invoice Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.return_to_invoice_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AH</TableCell>
                      <TableCell>NCB Protect Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.ncb_protect_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AI</TableCell>
                      <TableCell>Consumables Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.consumables_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AJ</TableCell>
                      <TableCell>Geographical Extension OD Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.geo_extension_od_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AK</TableCell>
                      <TableCell>Built-in CNG/LPG OD Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.builtin_cng_od_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AL</TableCell>
                      <TableCell>CNG/LPG OD Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.cng_lpg_od_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AM</TableCell>
                      <TableCell>Loss of Key Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.loss_of_key_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AN</TableCell>
                      <TableCell>Additional Towing Charges Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.towing_charges_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AO</TableCell>
                      <TableCell>Medical Expenses Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.medical_expenses_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AP</TableCell>
                      <TableCell>Tyre & RIM Protector Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.tyre_rim_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AQ</TableCell>
                      <TableCell>Personal Effects Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.personal_effects_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AR</TableCell>
                      <TableCell>Courtesy Car Cover Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.courtesy_car_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AS</TableCell>
                      <TableCell>Road Tax Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.road_tax_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>

                    {/* TP Premiums */}
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell colSpan={3}><strong>Third Party Premiums</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AT</TableCell>
                      <TableCell>Basic TP</TableCell>
                      <TableCell align="right">₹{result.calculations.basic_tp_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AU</TableCell>
                      <TableCell>CPA Owner Driver Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.cpa_owner_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AV</TableCell>
                      <TableCell>LL to Paid Driver</TableCell>
                      <TableCell align="right">₹{result.calculations.ll_paid_driver_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AW</TableCell>
                      <TableCell>CNG/LPG TP Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.cng_lpg_tp_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AX</TableCell>
                      <TableCell>Geographical Extension TP Premium</TableCell>
                      <TableCell align="right">₹{result.calculations.geo_extension_tp_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>

                    {/* Discounts & Final */}
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell colSpan={3}><strong>Discounts & Final Premium</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AY</TableCell>
                      <TableCell>OD Discount</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>-₹{result.calculations.od_discount_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AZ</TableCell>
                      <TableCell>NCB Discount</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>-₹{result.calculations.ncb_discount_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>BA</TableCell>
                      <TableCell><strong>Net Premium</strong></TableCell>
                      <TableCell align="right"><strong>₹{result.calculations.net_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>BB</TableCell>
                      <TableCell>CGST @9%</TableCell>
                      <TableCell align="right">₹{result.calculations.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>BC</TableCell>
                      <TableCell>SGST @9%</TableCell>
                      <TableCell align="right">₹{result.calculations.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'success.light' }}>
                      <TableCell>BD</TableCell>
                      <TableCell><strong>TOTAL PREMIUM</strong></TableCell>
                      <TableCell align="right"><strong>₹{result.calculations.total_premium.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark">
                  <strong>Note:</strong> Columns BE-CH are display copies of AA-BD and contain identical values.
                  This matches the Excel structure exactly with all 86 fields: 26 inputs (A-Z) + 30 calculations (AA-BD) + 30 display (BE-CH).
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Paper>
  );
};

export default CompleteCalculator;
