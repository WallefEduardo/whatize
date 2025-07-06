import React, { useState, useEffect, useCallback } from "react";
import { makeStyles, Paper, Typography, Modal, Box, CircularProgress } from "@material-ui/core";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import HelpsSidebar from "../../components/HelpsSidebar";
import HelpVideoCard from "../../components/HelpVideoCard";
import HelpSearchBar from "../../components/HelpSearchBar";
import { i18n } from "../../translate/i18n";
import useHelps from "../../hooks/useHelps";

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    height: 'calc(100vh - 200px)',
    overflow: 'hidden'
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  videosContainer: {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing(0, 2, 2, 2),
    ...theme.scrollbarStyles,
    // Mobile: usar grid
    [theme.breakpoints.down('md')]: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: theme.spacing(2),
      alignContent: 'start',
    }
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.palette.text.secondary
  },
  videoModal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoModalContent: {
    outline: 'none',
    width: '90%',
    maxWidth: 1024,
    aspectRatio: '16/9',
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: theme.spacing(1),
    overflow: 'hidden',
  },
  // Responsividade
  [theme.breakpoints.down('md')]: {
    container: {
      flexDirection: 'column',
      height: 'auto'
    }
  }
}));

const Helps = () => {
  const classes = useStyles();
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { list, getCategories } = useHelps();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [helps, categoriesData] = await Promise.all([
          list(),
          getCategories()
        ]);
        console.log('🔍 Dados carregados:', { helps, categoriesData });
        console.log('📊 Número de helps:', helps?.length || 0);
        console.log('📂 Número de categorias:', categoriesData?.length || 0);
        console.log('📋 Categorias detalhadas:', categoriesData);
        
        setRecords(helps);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buscar vídeos quando categoria ou termo de busca mudarem
  useEffect(() => {
    async function searchVideos() {
      setLoading(true);
      try {
        const params = {};
        if (selectedCategory) {
          params.category = selectedCategory;
        }
        if (searchTerm) {
          params.searchParam = searchTerm;
        }
        const helps = await list(params);
        setRecords(helps);
      } catch (error) {
        console.error("Erro ao buscar vídeos:", error);
      } finally {
        setLoading(false);
      }
    }
    searchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchTerm]);

  const openVideoModal = (video) => {
    setSelectedVideo(video.video);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setMobileMenuOpen(false); // Fechar menu após seleção
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getTotalVideos = () => {
    // Se há filtro aplicado, usar o número de registros atual
    if (selectedCategory || searchTerm) {
      return records.length;
    }
    
    // Se há categorias com contagem válida, usar a soma
    if (categories && categories.length > 0) {
      const totalFromCategories = categories.reduce((total, cat) => total + parseInt(cat.count || 0), 0);
      // Se a soma das categorias é maior que 0, usar ela, senão usar records.length
      return totalFromCategories > 0 ? totalFromCategories : records.length;
    }
    
    // Fallback para número de registros
    return records.length;
  };

  const handleModalClose = useCallback((event) => {
    if (event.key === "Escape") {
      closeVideoModal();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleModalClose);
    return () => {
      document.removeEventListener("keydown", handleModalClose);
    };
  }, [handleModalClose]);

  const renderVideoModal = () => {
    return (
      <Modal
        open={Boolean(selectedVideo)}
        onClose={closeVideoModal}
        className={classes.videoModal}
      >
        <div className={classes.videoModalContent}>
          {selectedVideo && (
            <iframe
              style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
              src={`https://www.youtube.com/embed/${selectedVideo}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </Modal>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={classes.loadingContainer}>
          <CircularProgress />
        </div>
      );
    }

    if (!records.length) {
      return (
        <div className={classes.emptyState}>
          <Typography variant="h6" gutterBottom>
            Nenhum vídeo encontrado
          </Typography>
          <Typography variant="body2">
            {searchTerm || selectedCategory 
              ? "Tente ajustar sua busca ou selecionar uma categoria diferente."
              : "Ainda não há vídeos cadastrados no sistema."
            }
          </Typography>
        </div>
      );
    }

    return records.map((record) => (
      <HelpVideoCard
        key={record.id}
        video={record}
        onClick={openVideoModal}
      />
    ));
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>{i18n.t("helps.title")} ({getTotalVideos()})</Title>
        <MainHeaderButtonsWrapper></MainHeaderButtonsWrapper>
      </MainHeader>
      
      <Box className={classes.container}>
        {/* Sidebar com categorias */}
        <HelpsSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          totalVideos={getTotalVideos()}
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuToggle={handleMobileMenuToggle}
        />
        
        {/* Conteúdo principal */}
        <div className={classes.content}>
          {/* Barra de busca */}
          <HelpSearchBar onSearch={handleSearch} onMenuClick={handleMobileMenuToggle} />
          
          {/* Lista de vídeos */}
          <div className={classes.videosContainer}>
            {renderContent()}
          </div>
        </div>
      </Box>
      
      {/* Modal do vídeo */}
      {renderVideoModal()}
    </MainContainer>
  );
};

export default Helps;