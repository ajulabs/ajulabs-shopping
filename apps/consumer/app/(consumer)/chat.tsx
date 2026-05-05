import { useState } from 'react';
import { SplashConsumer } from '../../src/features/consumer/splash';
import { ChatIA } from '../../src/features/consumer/chat';

export default function ChatScreen() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashConsumer onDone={() => setShowSplash(false)} />;
  }

  // ChatIA vai aqui quando o Dev 1 implementar
  return <ChatIA />;
}