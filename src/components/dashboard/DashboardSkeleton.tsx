import { Box, Grid, Skeleton } from "@mui/material";

export default function DashboardSkeleton() {
  return (
    <Box component="main" sx={{ p: { xs: 3, md: 6 } }}>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
      <Skeleton variant="text" width={120} height={24} sx={{ mb: 4 }} />

      <Grid container spacing={3} columns={{ xs: 1, md: 12 }}>
        <Grid size={{ xs: 1, md: 8 }}>
          <Skeleton
            variant="rounded"
            sx={{ height: { xs: 280, md: 420 }, borderRadius: 3 }}
          />
        </Grid>
        <Grid size={{ xs: 1, md: 4 }}>
          <Skeleton
            variant="rounded"
            sx={{ height: { xs: 220, md: 420 }, borderRadius: 3 }}
          />
        </Grid>
        <Grid size={{ xs: 1, md: 4 }}>
          <Skeleton
            variant="rounded"
            sx={{ height: 180, borderRadius: 3 }}
          />
        </Grid>
        <Grid size={{ xs: 1, md: 4 }}>
          <Skeleton
            variant="rounded"
            sx={{ height: 180, borderRadius: 3 }}
          />
        </Grid>
        <Grid size={{ xs: 1, md: 4 }}>
          <Skeleton
            variant="rounded"
            sx={{ height: 180, borderRadius: 3 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

