import { useState } from 'react';
import { SplashConsumer } from '../../src/features/consumer/splash';

export default function ChatScreen() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashConsumer onDone={() => setShowSplash(false)} />;
  }

  // ChatIA vai aqui quando o Dev 1 implementar
  return null;
}