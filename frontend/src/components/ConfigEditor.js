import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Button, Box, Alert, Tabs, Tab,
  TextField, Grid, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import calculatorAPI from '../services/api';
import { saveAs } from 'file-saver';

const ConfigEditor = () => {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const [configs, setConfigs] = useState({
    odRates: null,
    tpRates: null,
    addons: null,
    discounts: null,
    gst: null
  });

  const [editedConfigs, setEditedConfigs] = useState({
    odRates: '',
    tpRates: '',
    addons: '',
    discounts: '',
    gst: ''
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const [odRates, tpRates, addons, discounts, gst] = await Promise.all([
        calculatorAPI.getODRates(),
        calculatorAPI.getTPRates(),
        calculatorAPI.getAddonConfig(),
        calculatorAPI.getDiscountConfig(),
        calculatorAPI.getGSTConfig()
      ]);

      setConfigs({ odRates, tpRates, addons, discounts, gst });
      setEditedConfigs({
        odRates: JSON.stringify(odRates, null, 2),
        tpRates: JSON.stringify(tpRates, null, 2),
        addons: JSON.stringify(addons, null, 2),
        discounts: JSON.stringify(discounts, null, 2),
        gst: JSON.stringify(gst, null, 2)
      });
    } catch (err) {
      setError('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleConfigChange = (configType, value) => {
    setEditedConfigs(prev => ({
      ...prev,
      [configType]: value
    }));
  };

  const validateJSON = (jsonString) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    const configTypes = ['odRates', 'tpRates', 'addons', 'discounts', 'gst'];
    const currentType = configTypes[tabValue];
    const configValue = editedConfigs[currentType];

    if (!validateJSON(configValue)) {
      setError('Invalid JSON format');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config = JSON.parse(configValue);
      
      if (currentType === 'odRates') {
        await calculatorAPI.updateODRates(config);
      } else if (currentType === 'tpRates') {
        await calculatorAPI.updateTPRates(config);
      } else if (currentType === 'addons') {
        await calculatorAPI.updateAddonConfig(config);
      } else if (currentType === 'discounts') {
        await calculatorAPI.updateDiscountConfig(config);
      } else if (currentType === 'gst') {
        await calculatorAPI.updateGSTConfig(config);
      }

      setSuccess('Configuration saved successfully!');
      setSaveDialogOpen(false);
      await loadConfigs();
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const configTypes = ['odRates', 'tpRates', 'addons', 'discounts', 'gst'];
    const currentType = configTypes[tabValue];
    const configValue = editedConfigs[currentType];

    const blob = new Blob([configValue], { type: 'application/json' });
    saveAs(blob, `${currentType}_config.json`);
  };

  const handleReset = () => {
    const configTypes = ['odRates', 'tpRates', 'addons', 'discounts', 'gst'];
    const currentType = configTypes[tabValue];
    
    setEditedConfigs(prev => ({
      ...prev,
      [currentType]: JSON.stringify(configs[currentType], null, 2)
    }));
    setError(null);
    setSuccess(null);
  };

  if (loading && !configs.odRates) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading configurations...</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Configuration Editor</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Edit rate configurations, add-on formulas, and discount rules. Changes will update the JSON files.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="OD Rates" />
          <Tab label="TP Rates" />
          <Tab label="Add-ons" />
          <Tab label="Discounts" />
          <Tab label="GST" />
        </Tabs>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TextField
        fullWidth
        multiline
        rows={20}
        value={editedConfigs[['odRates', 'tpRates', 'addons', 'discounts', 'gst'][tabValue]]}
        onChange={(e) => handleConfigChange(
          ['odRates', 'tpRates', 'addons', 'discounts', 'gst'][tabValue],
          e.target.value
        )}
        variant="outlined"
        sx={{ fontFamily: 'monospace', mb: 2 }}
      />

      <Grid container spacing={2}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialogOpen(true)}
            disabled={loading}
          >
            Save Changes
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download JSON
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={handleReset}>
            Reset
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Changes to rate configurations will be applied immediately.
          Make sure to validate your JSON before saving. Download a backup before making changes.
        </Typography>
      </Box>

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Confirm Save</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to save these configuration changes? This will update the JSON file.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ConfigEditor;
