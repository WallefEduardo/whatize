import express from "express";
import imageDownloadLogger from "../utils/imageDownloadLogger";
import isAuth from "../middleware/isAuth";

const imageMonitoringRoutes = express.Router();

/**
 * GET /image-monitoring/stats
 * Retorna estatísticas de download de imagens
 */
imageMonitoringRoutes.get("/stats", isAuth, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const stats = imageDownloadLogger.getErrorStats(hours);
    
    return res.json({
      success: true,
      data: {
        period: `${hours}h`,
        errors: stats,
        recommendations: getRecommendations(stats)
      }
    });
  } catch (error) {
    console.error("Erro ao obter estatísticas de imagem:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * Gera recomendações baseadas nas estatísticas
 */
function getRecommendations(stats: any): string[] {
  const recommendations: string[] = [];
  
  if (stats.by502 > 10) {
    recommendations.push("Alto número de erros 502 - Verificar configuração do servidor web (nginx/apache)");
  }
  
  if (stats.by404 > 5) {
    recommendations.push("Muitas imagens não encontradas - Verificar URLs de imagem de perfil");
  }
  
  if (stats.byTimeout > 5) {
    recommendations.push("Muitos timeouts - Considerar aumentar o timeout ou verificar conectividade");
  }
  
  if (stats.total > 50) {
    recommendations.push("Alto volume de erros de imagem - Implementar cache local ou CDN");
  }
  
  if (stats.mostCommonUrls.some((url: string) => url.includes('nopicture.png'))) {
    recommendations.push("Erro recorrente com imagem placeholder - Verificar configuração do frontend");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Sistema de download de imagens funcionando normalmente");
  }
  
  return recommendations;
}

export default imageMonitoringRoutes; 