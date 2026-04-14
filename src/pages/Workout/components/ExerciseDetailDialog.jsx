import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    IconButton,
    Button,
    Chip,
} from '@mui/material';
import {
    X as MdClose,
    PlayCircle as MdPlayCircle,
} from 'lucide-react';
import { LayoutGrid, ListOrdered, Play, Lightbulb, Target, Zap, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid size={16} /> },
    { id: 'steps', label: 'Steps', icon: <ListOrdered size={16} /> },
    { id: 'demo', label: 'Demo', icon: <Play size={16} /> },
    { id: 'tips', label: 'Tips', icon: <Lightbulb size={16} /> },
];

const ExerciseDetailDialog = ({ open, onClose, exercise }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!exercise) return null;

    const name = exercise.title || exercise.name || 'Exercise';
    const description = exercise.description || 'No description available.';
    const steps = exercise.steps || [];
    const proTips = exercise.proTips || exercise.pro_tips || [];
    const commonMistakes = exercise.commonMistakes || exercise.common_mistakes || [];
    const primaryMuscle = exercise.primary_muscle || exercise.primaryMuscle || '';
    const secondaryMuscles = exercise.secondary_muscles || exercise.secondaryMuscles || [];
    const equipment = exercise.equipmentNeeded || exercise.equipment_needed || exercise.equipment || [];
    const videoUrls = exercise.videoUrls || exercise.video_urls || {};
    const difficulty = exercise.difficulty || 'Beginner';
    
    const variations = exercise.variations || [];
    const safetyConsiderations = exercise.safetyConsiderations || exercise.safety_considerations || [];
    const tags = exercise.tags || [];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    background: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '16px',
                    maxHeight: '85vh',
                    color: '#fff',
                },
            }}
        >
            <DialogContent sx={{ p: 0, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: '3px' } }}>
                {/* Header */}
                <Box sx={{ p: 3, pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography variant="h5" sx={{ color: '#dded00', fontWeight: 'bold', mb: 0.5 }}>
                                {name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                Detailed exercise information and instructions
                            </Typography>
                        </Box>
                        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#fff' } }}>
                            <MdClose />
                        </IconButton>
                    </Box>

                    {/* Tab Bar */}
                    <Box sx={{
                        display: 'flex',
                        gap: 0.5,
                        mt: 2.5,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        pb: 0,
                    }}>
                        {tabs.map(tab => (
                            <Button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                startIcon={tab.icon}
                                sx={{
                                    color: activeTab === tab.id ? '#dded00' : 'rgba(255, 255, 255, 0.5)',
                                    textTransform: 'none',
                                    fontSize: '0.85rem',
                                    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                    borderBottom: activeTab === tab.id ? '2px solid #dded00' : '2px solid transparent',
                                    borderRadius: 0,
                                    px: 2,
                                    py: 1,
                                    minWidth: 'auto',
                                    '&:hover': {
                                        backgroundColor: 'rgba(221, 237, 0, 0.05)',
                                    },
                                }}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </Box>
                </Box>

                {/* Tab Content */}
                <Box sx={{ px: 3, pb: 3 }}>
                    {/* ═══════════ OVERVIEW TAB ═══════════ */}
                    {activeTab === 'overview' && (
                        <Box>
                            {/* Stats Row */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-around',
                                gap: 2,
                                mb: 3,
                                mt: 1,
                            }}>
                                {[
                                    { icon: <Target size={22} color="#dded00" />, label: 'Target Sets', value: '3' },
                                    { icon: <Zap size={22} color="#dded00" />, label: 'Target Reps', value: '10' },
                                    { icon: <Clock size={22} color="#dded00" />, label: 'Rest Time', value: '1:00' },
                                ].map((stat, i) => (
                                    <Box key={i} sx={{ textAlign: 'center' }}>
                                        <Box sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '12px',
                                            border: '1px solid rgba(221, 237, 0, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mx: 'auto',
                                            mb: 1,
                                        }}>
                                            {stat.icon}
                                        </Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.7rem' }}>
                                            {stat.label}
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {stat.value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* Description */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    mb: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontSize: '0.95rem',
                                }}>
                                    📋 Description
                                </Typography>
                                <Typography variant="body2" sx={{
                                    color: 'rgba(255, 255, 255, 0.65)',
                                    lineHeight: 1.7,
                                    fontSize: '0.875rem',
                                }}>
                                    {description}
                                </Typography>
                            </Box>

                            {/* Muscles */}
                            <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        mb: 1.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: '0.85rem',
                                    }}>
                                        💪 Primary Muscles
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                        {(Array.isArray(primaryMuscle) ? primaryMuscle : [primaryMuscle]).filter(Boolean).map((muscle, i) => (
                                            <Chip
                                                key={i}
                                                label={muscle}
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(221, 237, 0, 0.15)',
                                                    color: '#dded00',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    height: '26px',
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        mb: 1.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: '0.85rem',
                                    }}>
                                        💪 Secondary Muscles
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                        {secondaryMuscles.map((muscle, i) => (
                                            <Typography key={i} variant="body2" sx={{
                                                color: 'rgba(255, 255, 255, 0.55)',
                                                fontSize: '0.8rem',
                                            }}>
                                                {muscle}{i < secondaryMuscles.length - 1 ? ' · ' : ''}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>

                            {/* Equipment & Tags */}
                            <Box sx={{ display: 'flex', gap: 4 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        mb: 1.5,
                                        fontSize: '0.85rem',
                                    }}>
                                        Equipment Needed
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                        {(Array.isArray(equipment) ? equipment : [equipment]).filter(Boolean).length > 0 ? (
                                            (Array.isArray(equipment) ? equipment : [equipment]).filter(Boolean).map((item, i) => (
                                                <Chip
                                                    key={i}
                                                    label={item}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                        fontSize: '0.75rem',
                                                        height: '26px',
                                                    }}
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                                                Bodyweight / None
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {tags.length > 0 && (
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            mb: 1.5,
                                            fontSize: '0.85rem',
                                        }}>
                                            🏷️ Tags
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                            {tags.map((tag, i) => (
                                                <Chip
                                                    key={i}
                                                    label={tag}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                        fontSize: '0.75rem',
                                                        height: '26px',
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* ═══════════ STEPS TAB ═══════════ */}
                    {activeTab === 'steps' && (
                        <Box>
                            <Typography variant="subtitle2" sx={{
                                color: '#fff',
                                fontWeight: 'bold',
                                mb: 2.5,
                                mt: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                fontSize: '0.95rem',
                            }}>
                                📋 Step-by-Step Instructions
                            </Typography>

                            {steps.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {steps.map((step, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 2,
                                            }}
                                        >
                                            <Box sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #dded00 0%, #b8c400 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                mt: 0.25,
                                            }}>
                                                <Typography sx={{
                                                    color: '#000',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem',
                                                }}>
                                                    {index + 1}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{
                                                color: 'rgba(255, 255, 255, 0.75)',
                                                lineHeight: 1.6,
                                                fontSize: '0.875rem',
                                                pt: 0.5,
                                            }}>
                                                {step}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                                    No step-by-step instructions available for this exercise.
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* ═══════════ DEMO TAB ═══════════ */}
                    {activeTab === 'demo' && (
                        <Box sx={{ mt: 1 }}>
                            {(videoUrls['720p'] || videoUrls['480p']) ? (
                                <Box sx={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    position: 'relative',
                                    backgroundColor: '#000',
                                }}>
                                    <video
                                        src={videoUrls['720p'] || videoUrls['480p']}
                                        controls
                                        loop
                                        muted
                                        autoPlay
                                        style={{
                                            width: '100%',
                                            maxHeight: '400px',
                                            objectFit: 'contain',
                                            display: 'block',
                                        }}
                                        onError={(e) => {
                                            if (videoUrls['480p'] && e.target.src !== videoUrls['480p']) {
                                                e.target.src = videoUrls['480p'];
                                            }
                                        }}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </Box>
                            ) : (
                                <Box sx={{
                                    height: '300px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    background: 'rgba(0, 0, 0, 0.3)',
                                }}>
                                    <MdPlayCircle size={48} color="rgba(255, 255, 255, 0.2)" />
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                        Video demo not available for this exercise
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                    <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Difficulty:</strong> {difficulty}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* ═══════════ TIPS TAB ═══════════ */}
                    {activeTab === 'tips' && (
                        <Box>
                            {/* Pro Tips */}
                            {proTips.length > 0 && (
                                <Box sx={{ mb: 3, mt: 1 }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: '0.95rem',
                                    }}>
                                        <CheckCircle size={18} color="#4caf50" />
                                        Pro Tips
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {proTips.map((tip, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5,
                                                    p: 1.5,
                                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                                    border: '1px solid rgba(76, 175, 80, 0.2)',
                                                    borderRadius: '10px',
                                                }}
                                            >
                                                <CheckCircle size={16} color="#4caf50" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <Typography variant="body2" sx={{
                                                    color: 'rgba(255, 255, 255, 0.75)',
                                                    fontSize: '0.85rem',
                                                    lineHeight: 1.5,
                                                }}>
                                                    {tip}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Common Mistakes */}
                            {commonMistakes.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: '0.95rem',
                                    }}>
                                        <AlertTriangle size={18} color="#ff9800" />
                                        Common Mistakes to Avoid
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {commonMistakes.map((mistake, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5,
                                                    p: 1.5,
                                                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                                    border: '1px solid rgba(255, 152, 0, 0.2)',
                                                    borderRadius: '10px',
                                                }}
                                            >
                                                <AlertTriangle size={16} color="#ff9800" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <Typography variant="body2" sx={{
                                                    color: 'rgba(255, 255, 255, 0.75)',
                                                    fontSize: '0.85rem',
                                                    lineHeight: 1.5,
                                                }}>
                                                    {mistake}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Warning: Safety Considerations */}
                            {safetyConsiderations.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: '0.95rem',
                                    }}>
                                        <AlertTriangle size={18} color="#f44336" />
                                        Safety Considerations
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {safetyConsiderations.map((safety, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5,
                                                    p: 1.5,
                                                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                                    border: '1px solid rgba(244, 67, 54, 0.2)',
                                                    borderRadius: '10px',
                                                }}
                                            >
                                                <AlertTriangle size={16} color="#f44336" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <Typography variant="body2" sx={{
                                                    color: 'rgba(255, 255, 255, 0.85)',
                                                    fontSize: '0.85rem',
                                                    lineHeight: 1.5,
                                                }}>
                                                    {safety}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                            
                            {/* Variations */}
                            {variations.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: '0.95rem',
                                    }}>
                                        🔄 Variations
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {variations.map((variation, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5,
                                                    p: 1.5,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '10px',
                                                }}
                                            >
                                                <Typography variant="body2" sx={{
                                                    color: 'rgba(255, 255, 255, 0.75)',
                                                    fontSize: '0.85rem',
                                                    lineHeight: 1.5,
                                                }}>
                                                    • {variation}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {proTips.length === 0 && commonMistakes.length === 0 && safetyConsiderations.length === 0 && variations.length === 0 && (
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', mt: 1 }}>
                                    No tips available for this exercise.
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

ExerciseDetailDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    exercise: PropTypes.object,
};

export default ExerciseDetailDialog;
