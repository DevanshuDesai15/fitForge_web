import PropTypes from 'prop-types';
import { Switch } from '@mui/material';

const FitForgeSwitch = ({ checked, onChange, inputProps = undefined, ...props }) => {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      inputProps={inputProps}
      sx={{
        width: 48,
        height: 28,
        padding: 0,
        '& .MuiSwitch-switchBase': {
          padding: 0,
          margin: '3px',
          transitionDuration: '250ms',
          color: '#fff',
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            color: '#1a1a1a',
            '& + .MuiSwitch-track': {
              backgroundColor: '#dded00',
              opacity: 1,
              border: 0,
            },
          },
        },
        '& .MuiSwitch-thumb': {
          width: 22,
          height: 22,
          boxShadow: 'none',
        },
        '& .MuiSwitch-track': {
          borderRadius: 14,
          backgroundColor: '#3a3a3a',
          opacity: 1,
        },
      }}
      {...props}
    />
  );
};

FitForgeSwitch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  inputProps: PropTypes.object,
};

export default FitForgeSwitch;
