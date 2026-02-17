import React, { useState } from 'react';
import {
  Paper, Grid, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Typography, Box, Card, CardContent, Divider, Alert,
  FormControlLabel, Checkbox, CircularProgress
} from '@mui/material';
import calculatorAPI from '../services/api';

const Calculator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    cc_category: 'upto_1000cc',
    zone: 'A',
    purchase_date: '2024-01-01',
    idv: 100000,
    ncb_percent: 0,
    od_discount_percent: 0,
    builtin_cng_lpg: 0,
    cng_lpg_si: 0,
    nil_dep: 0,
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
    cpa_owner_driver: 0,
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
      <Typography variant="h5" gutterBottom>Premium Calculator</Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary">Vehicle Information</Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Cubic Capacity</InputLabel>
              <Select name="cc_category" value={formData.cc_category} onChange={handleChange} required>
                <MenuItem value="upto_1000cc">Upto 1000cc</MenuItem>
                <MenuItem value="1000cc_1500cc">1000cc - 1500cc</MenuItem>
                <MenuItem value="above_1500cc">Above 1500cc</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Zone</InputLabel>
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
              label="Purchase Date"
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
              label="IDV (₹)"
              name="idv"
              value={formData.idv}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="NCB (%)"
              name="ncb_percent"
              value={formData.ncb_percent}
              onChange={handleChange}
              inputProps={{ min: 0, max: 50 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="OD Discount (%)"
              name="od_discount_percent"
              value={formData.od_discount_percent}
              onChange={handleChange}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>

          {/* Add-ons */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary">Add-on Covers</Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="nil_dep" checked={!!formData.nil_dep} onChange={handleChange} />}
              label="Zero Depreciation"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="engine_protection" checked={!!formData.engine_protection} onChange={handleChange} />}
              label="Engine Protection"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="return_to_invoice" checked={!!formData.return_to_invoice} onChange={handleChange} />}
              label="Return to Invoice"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="consumables" checked={!!formData.consumables} onChange={handleChange} />}
              label="Consumables"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="road_side_assistance" checked={!!formData.road_side_assistance} onChange={handleChange} />}
              label="Road Side Assistance"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="medical_expenses" checked={!!formData.medical_expenses} onChange={handleChange} />}
              label="Medical Expenses"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox name="cpa_owner_driver" checked={!!formData.cpa_owner_driver} onChange={handleChange} />}
              label="CPA Owner Driver"
            />
          </Grid>

          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Calculate Premium'}
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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Calculation Results</Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Vehicle Age</Typography>
                  <Typography variant="h6">{result.calculations.age_years} years</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">OD Base Rate</Typography>
                  <Typography variant="h6">{result.calculations.od_base_rate_percent}%</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Basic OD Premium</Typography>
                  <Typography variant="h6">₹{result.calculations.basic_od_premium.toLocaleString()}</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Basic TP Premium</Typography>
                  <Typography variant="h6">₹{result.calculations.basic_tp_premium.toLocaleString()}</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">OD Discount</Typography>
                  <Typography variant="h6" color="error">-₹{result.calculations.od_discount_amount.toLocaleString()}</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">NCB Discount</Typography>
                  <Typography variant="h6" color="error">-₹{result.calculations.ncb_discount_amount.toLocaleString()}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Net Premium</Typography>
                  <Typography variant="h6">₹{result.calculations.net_premium.toLocaleString()}</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">GST (18%)</Typography>
                  <Typography variant="h6">₹{(result.calculations.cgst + result.calculations.sgst).toLocaleString()}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, borderRadius: 1 }}>
                    <Typography variant="h5" align="center">
                      Total Premium: ₹{result.calculations.total_premium.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
    </Paper>
  );
};

export default Calculator;
