import React, { useState, useEffect, useMemo } from "react";
// Importar polyfill PRIMEIRO para definir todos os componentes lamejs globalmente
import "./utils/micRecorderPolyfill";
// Importar sistema de cores
import "./styles/colors.css";
// Importar Animate.css para animações
import "animate.css";
import api from "./services/api";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./config/query-config";
import { ptBR } from "@mui/material/locale";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import { Toaster } from "react-hot-toast";
import ColorModeContext from "./layout/themeContext";
import { ActiveMenuProvider } from "./context/ActiveMenuContext";
import { MantineProvider } from "@mantine/core";
// Favicon functionality implemented directly with useEffect
import { getBackendUrl } from "./config";
import Routes from "./routes/index.jsx";
import defaultLogoLight from "./assets/logo.png";
import defaultLogoDark from "./assets/logo-black.png";
import defaultLogoFavicon from "./assets/favicon.ico";
import useSettings from "./hooks/useSettings";


const App = () => {
  const [locale, setLocale] = useState();
  const appColorLocalStorage = localStorage.getItem("primaryColorLight") || localStorage.getItem("primaryColorDark") || "#00C307";
  const appNameLocalStorage = localStorage.getItem("appName") || "";
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const [mode, setMode] = useState(preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light");
  const [primaryColorLight, setPrimaryColorLight] = useState("#00C307"); // Verde padrão
  const [primaryColorDark, setPrimaryColorDark] = useState("#00C307"); // Verde padrão (mesmo para dark)
  const [appLogoLight, setAppLogoLight] = useState(defaultLogoLight);
  const [appLogoDark, setAppLogoDark] = useState(defaultLogoDark);
  const [appLogoFavicon, setAppLogoFavicon] = useState(defaultLogoFavicon);
  const [appName, setAppName] = useState(appNameLocalStorage);
  const { getPublicSetting } = useSettings();

  // Função para validar se é uma cor válida
  const isValidColor = (color) => {
    // Se for undefined, null ou string vazia, usar padrão
    if (!color || typeof color !== 'string') return false;
    
    const trimmed = color.trim();
    
    // Se for string vazia ou textos inválidos, usar padrão
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed === '') {
      return false;
    }
    
    // Verificar se é HTML (contém < ou >)
    if (trimmed.includes('<') || trimmed.includes('>')) return false;
    
    // Verificar se parece com uma cor válida (hex, rgb, hsl, ou nome)
    const colorPattern = /^(#[0-9A-Fa-f]{3,8}|rgb\(|hsl\(|[a-zA-Z]+).*$/;
    return colorPattern.test(trimmed);
  };

  // Função para validar se um texto não contém HTML
  const isValidText = (text) => {
    // Se for undefined, null ou string vazia, usar padrão
    if (!text || typeof text !== 'string') return false;
    
    const trimmed = text.trim();
    
    // Se for string vazia ou textos inválidos, usar padrão
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed === '') {
      return false;
    }
    
    // Verificar se contém HTML
    if (trimmed.includes('<') || trimmed.includes('>')) return false;
    
    return true;
  };

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          window.localStorage.setItem("preferredTheme", newMode); // Persistindo o tema no localStorage
          return newMode;
        });
      },
      setPrimaryColorLight,
      setPrimaryColorDark,
      setAppLogoLight,
      setAppLogoDark,
      setAppLogoFavicon,
      setAppName,
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      mode,
    }),
    [appLogoLight, appLogoDark, appLogoFavicon, appName, mode]
  );

  const theme = useMemo(
    () =>
      createTheme(
        {
          scrollbarStyles: {
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)",
              backgroundColor: mode === "light" ? primaryColorLight : primaryColorDark,
            },
          },
          scrollbarStylesSoft: {
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: mode === "light" ? "#F3F3F3" : "#333333",
            },
          },
          typography: {
            fontFamily: "Poppins, sans-serif !important",
          },
          overrides: {
            MuiDialog: {
              root: {
                backdropFilter: "blur(4px)",
              },
            },
          },
          palette: {
            type: mode,
            primary: { main: mode === "light" ? primaryColorLight : primaryColorDark },
            textPrimary: mode === "light" ? primaryColorLight : primaryColorDark,
            borderPrimary: mode === "light" ? primaryColorLight : primaryColorDark,
            dark: { main: mode === "light" ? "#333333" : "#F3F3F3" },
            light: { main: mode === "light" ? "#F3F3F3" : "#333333" },
            fontColor: mode === "light" ? primaryColorLight : primaryColorDark,
            tabHeaderBackground: mode === "light" ? "#EEE" : "#666",
            optionsBackground: mode === "light" ? "#fafafa" : "#333",
            fancyBackground: mode === "light" ? "#fafafa" : "#333",
            total: mode === "light" ? "#fff" : "#222",
            messageIcons: mode === "light" ? "grey" : "#F3F3F3",
            inputBackground: mode === "light" ? "#FFFFFF" : "#333",
            barraSuperior: mode === "light" ? primaryColorLight : "#666",
          },
          mode,
          appLogoLight,
          appLogoDark,
          appLogoFavicon,
          appName,
          calculatedLogoDark: () => {
            if (appLogoDark === defaultLogoDark && appLogoLight !== defaultLogoLight) {
              return appLogoLight;
            }
            return appLogoDark;
          },
          calculatedLogoLight: () => {
            if (appLogoDark !== defaultLogoDark && appLogoLight === defaultLogoLight) {
              return appLogoDark;
            }
            return appLogoLight;
          },
        },
        locale
      ),
    [appLogoLight, appLogoDark, appLogoFavicon, appName, locale, mode, primaryColorDark, primaryColorLight]
  );

  useEffect(() => {
    const i18nlocale = localStorage.getItem("i18nextLng");
    const browserLocale = i18nlocale.substring(0, 2) + i18nlocale.substring(3, 5);

    if (browserLocale === "ptBR") {
      setLocale(ptBR);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("preferredTheme", mode);
  }, [mode]);

  useEffect(() => {
    console.log("|=========== handleSaveSetting ==========|")
    console.log("APP START")
    console.log("|========================================|")
   
    // Carregar configurações com tratamento silencioso de erros
    const loadSetting = async (key, setter, defaultValue, isValidFn = null) => {
      try {
        const value = await getPublicSetting(key);
        
        if (isValidFn && !isValidFn(value)) {
          // Usar padrão silenciosamente se valor for inválido
          setter(defaultValue);
          return;
        }
        
        if (value && value !== 'undefined' && value !== 'null') {
          setter(value);
        } else {
          setter(defaultValue);
        }
      } catch (error) {
        console.log(`Error reading setting ${key}:`, error);
        setter(defaultValue);
      }
    };
    
    // Carregar todas as configurações
    loadSetting("primaryColorLight", setPrimaryColorLight, "#00C307", isValidColor);
    loadSetting("primaryColorDark", setPrimaryColorDark, "#00C307", isValidColor);
    loadSetting("appName", setAppName, "Whatize", isValidText);
    
    // Carregar logos (não precisam de validação especial)
    loadSetting("appLogoLight", (file) => {
      setAppLogoLight(file ? getBackendUrl() + "/public/" + file : defaultLogoLight);
    }, null);
    
    loadSetting("appLogoDark", (file) => {
      setAppLogoDark(file ? getBackendUrl() + "/public/" + file : defaultLogoDark);
    }, null);
    
    loadSetting("appLogoFavicon", (file) => {
      setAppLogoFavicon(file ? getBackendUrl() + "/public/" + file : defaultLogoFavicon);
    }, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Compatibilidade com variável antiga
    root.style.setProperty("--primaryColor", mode === "light" ? primaryColorLight : primaryColorDark);
    
    // Atualizar variáveis do novo sistema de cores
    root.style.setProperty("--color-accent", mode === "light" ? primaryColorLight : primaryColorDark);
    root.style.setProperty("--color-green-main", mode === "light" ? primaryColorLight : primaryColorDark);
    
    // Aplicar tema dark/light
    if (mode === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  }, [primaryColorLight, primaryColorDark, mode]);

  useEffect(() => {
    async function fetchVersionData() {
      try {
        const response = await api.get("/version");
        const { data } = response;
        window.localStorage.setItem("frontendVersion", data.version);
      } catch (error) {
        console.log("Error fetching data", error);
      }
    }
    fetchVersionData();
  }, []);

  // Handle favicon updates
  useEffect(() => {
    const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
    favicon.type = 'image/x-icon';
    favicon.rel = 'shortcut icon';
    favicon.href = appLogoFavicon ? getBackendUrl() + "/public/" + appLogoFavicon : defaultLogoFavicon;
    document.getElementsByTagName('head')[0].appendChild(favicon);
  }, [appLogoFavicon]);

  return (
    <>
      <MantineProvider>
        <ColorModeContext.Provider value={{ colorMode }}>
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
              <ActiveMenuProvider>
                <Routes />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: mode === 'dark' ? '#333' : '#fff',
                      color: mode === 'dark' ? '#fff' : '#333',
                    },
                  }}
                />
              </ActiveMenuProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </ColorModeContext.Provider>
      </MantineProvider>
    </>
  );
};

export default App;
