import { useState, type MouseEvent } from 'react';
import { Link as RouterLink, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../auth/authContext';

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const items = [
    { label: 'Каталог', to: '/objects' },
    ...(user ? [{ label: 'Журнал', to: '/journal' }] : []),
  ];

  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget);
  const closeMenu = () => setAnchor(null);
  const go = (to: string) => {
    closeMenu();
    navigate(to);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" enableColorOnDark>
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/objects"
            sx={{ color: 'inherit', textDecoration: 'none', mr: 3 }}
          >
            AstroPlanner
          </Typography>

          {}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
            {items.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                color="inherit"
                sx={{ '&.active': { bgcolor: 'action.selected' } }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                <Typography variant="body2">{user.username}</Typography>
                <Button color="inherit" variant="outlined" onClick={signOut}>
                  Вийти
                </Button>
              </>
            ) : (
              <Button component={RouterLink} to="/login" color="inherit" variant="outlined">
                Увійти
              </Button>
            )}
          </Box>

          {}
          <IconButton
            color="inherit"
            aria-label="Відкрити меню"
            onClick={openMenu}
            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
            {items.map((item) => (
              <MenuItem key={item.to} onClick={() => go(item.to)}>
                {item.label}
              </MenuItem>
            ))}
            <Divider />
            {user ? (
              <MenuItem
                onClick={() => {
                  closeMenu();
                  signOut();
                }}
              >
                Вийти ({user.username})
              </MenuItem>
            ) : (
              <MenuItem onClick={() => go('/login')}>Увійти</MenuItem>
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: 3, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
}