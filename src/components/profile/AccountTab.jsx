import { Box, Card, CardContent, Typography, Grid, Button, styled } from '@mui/material';
import { Shield, Smartphone, Download, LogOut, ChevronRight, Info, Lock, HelpCircle, Mail } from 'lucide-react';

const AccountCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#282828',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
}));

const ActionRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  marginBottom: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: '1px solid rgba(255, 255, 255, 0.05)',

  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: theme.palette.primary.main,
  },

  '&:last-child': {
    marginBottom: 0,
  },
}));

const ActionInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

const IconWrapper = styled(Box)(({ color }) => ({
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: color === 'green' ? 'rgba(76, 175, 80, 0.1)' :
                   color === 'red' ? 'rgba(244, 67, 54, 0.1)' :
                   'rgba(221, 237, 0, 0.1)',
  '& svg': {
    width: '20px',
    height: '20px',
    color: color === 'green' ? '#4caf50' :
           color === 'red' ? '#f44336' :
           '#dded00',
  },
}));

const ActionTextBox = styled(Box)({});

const ActionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '15px',
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

const ActionSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  color: theme.palette.text.secondary,
  marginTop: '2px',
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderColor: 'rgba(255, 255, 255, 0.2)',
  color: theme.palette.text.primary,
  textTransform: 'none',
  fontWeight: 500,
  minWidth: '100px',

  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(221, 237, 0, 0.05)',
  },
}));

const SignOutButton = styled(Button)(({ theme }) => ({
  width: '100%',
  marginTop: '16px',
  backgroundColor: 'rgba(244, 67, 54, 0.1)',
  color: '#f44336',
  border: '1px solid rgba(244, 67, 54, 0.3)',
  textTransform: 'none',
  fontWeight: 600,
  padding: '12px',

  '&:hover': {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderColor: '#f44336',
  },
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',

  '&:last-child': {
    borderBottom: 'none',
  },
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  color: theme.palette.text.secondary,
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

const LinkButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  color: theme.palette.text.secondary,
  padding: '8px 16px',
  fontSize: '14px',
  justifyContent: 'flex-start',

  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: theme.palette.primary.main,
  },
}));

const AccountTab = ({
  onPrivacyClick,
  onConnectedAppsClick,
  onDataExportClick,
  onSignOut,
  appVersion = '2.1.0',
  lastUpdated = 'Aug 28, 2025'
}) => {
  const securityActions = [
    {
      icon: Shield,
      iconColor: 'green',
      title: 'Privacy & Security',
      subtitle: 'Manage data privacy and security settings',
      buttonText: 'Configure',
      onClick: onPrivacyClick,
    },
    {
      icon: Smartphone,
      iconColor: 'yellow',
      title: 'Connected Apps',
      subtitle: 'Sync with other fitness applications',
      buttonText: 'Manage',
      onClick: onConnectedAppsClick,
    },
    {
      icon: Download,
      iconColor: 'yellow',
      title: 'Data Export',
      subtitle: 'Download your workout data',
      buttonText: 'Download',
      onClick: onDataExportClick,
    },
  ];

  const supportLinks = [
    { label: 'Privacy Policy', icon: Lock },
    { label: 'Terms of Service', icon: Info },
    { label: 'Help Center', icon: HelpCircle },
    { label: 'Contact Support', icon: Mail },
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        {/* Account Security Card */}
        <AccountCard>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Account Security
            </Typography>

            <Box>
              {securityActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <ActionRow key={index} onClick={action.onClick}>
                    <ActionInfo>
                      <IconWrapper color={action.iconColor}>
                        <Icon />
                      </IconWrapper>
                      <ActionTextBox>
                        <ActionTitle>{action.title}</ActionTitle>
                        <ActionSubtitle>{action.subtitle}</ActionSubtitle>
                      </ActionTextBox>
                    </ActionInfo>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ActionButton variant="outlined" size="small">
                        {action.buttonText}
                      </ActionButton>
                      <ChevronRight size={20} style={{ color: '#666' }} />
                    </Box>
                  </ActionRow>
                );
              })}
            </Box>

            <SignOutButton
              startIcon={<LogOut size={18} />}
              onClick={onSignOut}
            >
              Sign Out
            </SignOutButton>
          </CardContent>
        </AccountCard>
      </Grid>

      <Grid item xs={12} md={6}>
        {/* About FitForge Card */}
        <AccountCard>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              About FitForge
            </Typography>

            <Box sx={{ mb: 3 }}>
              <InfoRow>
                <InfoLabel>Version</InfoLabel>
                <InfoValue>{appVersion}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Last Updated</InfoLabel>
                <InfoValue>{lastUpdated}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Platform</InfoLabel>
                <InfoValue>Progressive Web App</InfoValue>
              </InfoRow>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Support & Legal
              </Typography>
              <Grid container spacing={1}>
                {supportLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <Grid item xs={6} key={index}>
                      <LinkButton
                        fullWidth
                        startIcon={<Icon />}
                        onClick={() => console.log(`Navigate to ${link.label}`)}
                      >
                        {link.label}
                      </LinkButton>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </CardContent>
        </AccountCard>
      </Grid>
    </Grid>
  );
};

export default AccountTab;
