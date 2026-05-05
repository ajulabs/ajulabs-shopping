import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { SplashLogo } from './SplashLogo';
import { SplashLoader } from './SplashLoader';

const SPLASH_DURATION = 2400;

interface SplashConsumerProps {
  onDone: () => void;
}

export function SplashConsumer({ onDone }: SplashConsumerProps) {
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const logoTranslate = useRef(new Animated.Value(16)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(12)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrada: logo primeiro, texto depois
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Fade out e chama onDone
    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(onDone);
    }, SPLASH_DURATION - 350);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000933" />

      {/* Glow laranja — topo direito */}
      <View style={styles.glowOrange} />

      {/* Glow azul escuro — base esquerda */}
      <View style={styles.glowBlue} />

      {/* Conteúdo central */}
      <View style={styles.center}>
        {/* Logo */}
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslate }],
          }}
        >
          <SplashLogo size={72} />
        </Animated.View>

        {/* Título + subtítulo */}
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslate }],
            },
          ]}
        >
          <Text style={styles.title}>
            Shopping <Text style={styles.titleOrange}>Digital</Text>
          </Text>
          <Text style={styles.subtitle}>
            O comércio de Aracaju na palma da sua mão.
          </Text>
        </Animated.View>
      </View>

      {/* Barra de loading */}
      <View style={styles.loaderWrapper}>
        <SplashLoader />
      </View>

      {/* Rodapé */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          BY <Text style={styles.footerBold}>AJULABS</Text>
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: '#000933',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Glows — imitam o gradiente radial do protótipo
  glowOrange: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: 'rgba(180, 60, 10, 0.28)',
    top: -160,
    right: -140,
  },
  glowBlue: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(20, 30, 90, 0.55)',
    bottom: -80,
    left: -80,
  },

  center: {
    alignItems: 'center',
    gap: 28,
  },

  textBlock: {
    alignItems: 'center',
    gap: 10,
  },

  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  titleOrange: {
    color: '#F2760F',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.60)',
    letterSpacing: 0.1,
    textAlign: 'center',
  },

  loaderWrapper: {
    position: 'absolute',
    bottom: 96,
  },

  footer: {
    position: 'absolute',
    bottom: 44,
  },
  footerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 3,
  },
  footerBold: {
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
});