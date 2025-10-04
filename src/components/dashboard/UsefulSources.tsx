"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Divider,
  Link,
  Stack,
  Tooltip,
} from "@mui/material";
import { Delete, OpenInNew, Bookmarks } from "@mui/icons-material";
import { BookmarkPlus, ExternalLink, Sparkles, Library } from "lucide-react";

export interface UsefulSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  addedAt: number;
}

interface UsefulSourcesProps {
  sources: UsefulSource[];
  onRemoveSource: (id: string) => void;
}

export default function UsefulSources({ sources, onRemoveSource }: UsefulSourcesProps) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        avatar={
          <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
            <Library size={24} />
          </Box>
        }
        title={<Typography variant="subtitle1">Useful Sources</Typography>}
        subheader={`${sources.length} source${sources.length !== 1 ? "s" : ""} saved`}
      />
      <Divider />
      <CardContent sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column", p: 0 }}>
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: 2,
          }}
        >
          {sources.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <BookmarkPlus size={48} style={{ color: '#9e9e9e' }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                No sources saved yet. Ask the AI assistant to search for websites and add useful sources here.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Try: &quot;Search for technical analysis guides&quot;
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {sources.map((source, index) => (
                <Box key={source.id}>
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  <ListItem
                    alignItems="flex-start"
                    sx={{ px: 0 }}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Open in new tab">
                          <IconButton
                            edge="end"
                            size="small"
                            component="a"
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ExternalLink size={16} />
                            </Box>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => onRemoveSource(source.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={
                        <Link
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{ 
                            fontWeight: 600,
                            display: "block",
                            mb: 0.5,
                            pr: 8, // Make room for action buttons
                          }}
                        >
                          {source.title}
                        </Link>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              pr: 8, // Make room for action buttons
                            }}
                          >
                            {source.snippet}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Added {new Date(source.addedAt).toLocaleString()}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

