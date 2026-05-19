import React from 'react';
import '../assets/styles/variables.css';

const estilos = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--color-primario) 0%, var(--color-secundario) 100%)',
    padding: '24px',
  },
  card: {
    background: 'var(--color-fondo-card)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    padding: '40px 48px',
    width: '100%',
    maxWidth: '440px',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
  },
  logoImg: {
    width: '72px',
    marginBottom: '8px',
  },
  logoTitulo: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--color-primario)',
    letterSpacing: '-0.5px',
  },
  logoAR: {
    color: 'var(--color-secundario)',
  },
};

function LayoutPublico({ children }) {
  return (
    <div style={estilos.wrapper}>
      <div style={estilos.card}>
        <div style={estilos.logo}>
          <img
            src="/logo.png"
            alt="RehabilitAR"
            style={estilos.logoImg}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span style={estilos.logoTitulo}>
            Rehabilit<span style={estilos.logoAR}>AR</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default LayoutPublico;
