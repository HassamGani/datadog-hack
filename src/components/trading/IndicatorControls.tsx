"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import { Add, Delete, Visibility, VisibilityOff } from "@mui/icons-material";
import { LineChart, TrendingUp, Activity, GitMerge, BarChart3, Waves, Gauge } from "lucide-react";
import type { IndicatorConfig, IndicatorType } from "@/lib/indicators/types";
import { INDICATOR_DEFAULTS, INDICATOR_DESCRIPTIONS } from "@/lib/indicators/types";
import { v4 as uuidv4 } from "uuid";

interface IndicatorControlsProps {
  indicators: IndicatorConfig[];
  onAddIndicator: (indicator: IndicatorConfig) => void;
  onRemoveIndicator: (id: string) => void;
  onToggleIndicator: (id: string) => void;
  onUpdateIndicator: (id: string, params: Record<string, number>) => void;
}

export default function IndicatorControls({
  indicators,
  onAddIndicator,
  onRemoveIndicator,
  onToggleIndicator,
  onUpdateIndicator,
}: IndicatorControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<IndicatorType>("sma");
  const [params, setParams] = useState<Record<string, number>>({});

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setSelectedType("sma");
    setParams({ period: 20 });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setParams({});
  };

  const handleTypeChange = (type: IndicatorType) => {
    setSelectedType(type);
    setParams(INDICATOR_DEFAULTS[type].params as Record<string, number>);
  };

  const handleAddIndicator = () => {
    const defaults = INDICATOR_DEFAULTS[selectedType];
    const indicator: IndicatorConfig = {
      id: uuidv4(),
      type: selectedType,
      name: defaults.name,
      params: { ...defaults.params, ...params },
      color: defaults.color,
      visible: true,
    };
    onAddIndicator(indicator);
    handleCloseDialog();
  };

  const getIndicatorIcon = (type: IndicatorType) => {
    const iconMap: Record<IndicatorType, React.ReactNode> = {
      sma: <LineChart size={18} />,
      ema: <TrendingUp size={18} />,
      rsi: <Gauge size={18} />,
      macd: <Activity size={18} />,
      bollinger: <Waves size={18} />,
      vwap: <BarChart3 size={18} />,
      atr: <Activity size={18} />,
      stochastic: <Gauge size={18} />,
    };
    return iconMap[type];
  };

  const getParamFields = (type: IndicatorType) => {
    const defaults = INDICATOR_DEFAULTS[type];
    const paramKeys = Object.keys(defaults.params);

    return paramKeys.map((key) => (
      <TextField
        key={key}
        label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
        type="number"
        value={params[key] ?? (defaults.params as any)[key]}
        onChange={(e) => setParams({ ...params, [key]: parseInt(e.target.value) || 0 })}
        fullWidth
        size="small"
      />
    ));
  };

  return (
    <>
      <Card>
        <CardHeader
          title={<Typography variant="subtitle1">Technical Indicators</Typography>}
          action={
            <Button startIcon={<Add />} variant="contained" size="small" onClick={handleOpenDialog}>
              Add Indicator
            </Button>
          }
        />
        <Divider />
        <CardContent>
          {indicators.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center">
              No indicators added. Click &quot;Add Indicator&quot; to get started.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {indicators.map((indicator) => (
                <Box
                  key={indicator.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: 24,
                      bgcolor: indicator.color,
                      borderRadius: 1,
                    }}
                  />
                  <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', ml: 0.5 }}>
                    {getIndicatorIcon(indicator.type)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {indicator.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Object.entries(indicator.params)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => onToggleIndicator(indicator.id)}
                    color={indicator.visible ? "primary" : "default"}
                  >
                    {indicator.visible ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onRemoveIndicator(indicator.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Technical Indicator</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Indicator Type</InputLabel>
              <Select
                value={selectedType}
                label="Indicator Type"
                onChange={(e) => handleTypeChange(e.target.value as IndicatorType)}
              >
                {Object.entries(INDICATOR_DEFAULTS).map(([type, config]) => (
                  <MenuItem key={type} value={type}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>{getIndicatorIcon(type as IndicatorType)}</Box>
                      <span>{config.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {INDICATOR_DESCRIPTIONS[selectedType]}
              </Typography>
            </Box>

            <Stack spacing={2}>{getParamFields(selectedType)}</Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddIndicator} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

