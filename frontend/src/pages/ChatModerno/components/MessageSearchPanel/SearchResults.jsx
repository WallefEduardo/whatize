import React, { memo } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Component interno
import MessageResult from './MessageResult';

const ResultsContainer = styled(Box)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const ResultsList = styled(Box)(() => ({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',

  // Custom scrollbar
  '&::-webkit-scrollbar': {
    width: '6px',
  },

  '&::-webkit-scrollbar-track': {
    backgroundColor: 'var(--bg-secondary)',
  },

  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'var(--border-primary)',
    borderRadius: '3px',

    '&:hover': {
      backgroundColor: 'var(--text-secondary)',
    },
  },
}));

const EmptyState = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '32px 24px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
}));

const LoadingState = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 24px',
  gap: '16px',
  color: 'var(--text-secondary)',
}));

const ResultsHeader = styled(Box)(() => ({
  padding: '12px 16px 8px',
  borderBottom: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-secondary)',
}));

const ResultsCount = styled(Typography)(() => ({
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const SearchResults = memo(({
  results = [],
  query = '',
  isLoading = false,
  onMessageClick,
  error = null,
  currentUser,
  profile,
  selectedContact
}) => {
  // Estado de loading
  if (isLoading) {
    return (
      <ResultsContainer>
        <LoadingState>
          <CircularProgress
            size={24}
            sx={{ color: 'var(--color-accent)' }}
          />
          <Typography variant="body2">
            Pesquisando mensagens...
          </Typography>
        </LoadingState>
      </ResultsContainer>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <ResultsContainer>
        <EmptyState>
          <ExclamationTriangleIcon
            style={{
              width: '48px',
              height: '48px',
              color: 'var(--color-error)',
              marginBottom: '16px'
            }}
          />
          <Typography variant="h6" sx={{ mb: 1, color: 'var(--text-primary)' }}>
            Erro na pesquisa
          </Typography>
          <Typography variant="body2">
            Não foi possível realizar a pesquisa. Tente novamente.
          </Typography>
        </EmptyState>
      </ResultsContainer>
    );
  }

  // Empty state - sem query
  if (!query.trim()) {
    return (
      <ResultsContainer>
        <EmptyState>
          <MagnifyingGlassIcon
            style={{
              width: '48px',
              height: '48px',
              marginBottom: '16px'
            }}
          />
          <Typography variant="h6" sx={{ mb: 1, color: 'var(--text-primary)' }}>
            Pesquisar mensagens
          </Typography>
          <Typography variant="body2">
            Digite algo no campo acima para pesquisar nas mensagens desta conversa.
          </Typography>
        </EmptyState>
      </ResultsContainer>
    );
  }

  // Empty state - sem resultados
  if (results.length === 0) {
    return (
      <ResultsContainer>
        <EmptyState>
          <MagnifyingGlassIcon
            style={{
              width: '48px',
              height: '48px',
              marginBottom: '16px'
            }}
          />
          <Typography variant="h6" sx={{ mb: 1, color: 'var(--text-primary)' }}>
            Nenhuma mensagem encontrada
          </Typography>
          <Typography variant="body2">
            Não encontramos mensagens que contenham <strong>"{query}"</strong>.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Tente usar outras palavras ou termos.
          </Typography>
        </EmptyState>
      </ResultsContainer>
    );
  }

  // Resultados encontrados
  return (
    <ResultsContainer>
      {/* Header com contador */}
      <ResultsHeader>
        <ResultsCount>
          {results.length} mensagem{results.length !== 1 ? 's' : ''} encontrada{results.length !== 1 ? 's' : ''}
        </ResultsCount>
      </ResultsHeader>

      {/* Lista de resultados */}
      <ResultsList>
        {results.map((message, index) => (
          <MessageResult
            key={`${message.id}-${index}`}
            message={message}
            query={query}
            onClick={() => onMessageClick && onMessageClick(message)}
            currentUser={currentUser}
            profile={profile}
            selectedContact={selectedContact}
          />
        ))}
      </ResultsList>
    </ResultsContainer>
  );
});

SearchResults.displayName = 'SearchResults';

export default SearchResults;