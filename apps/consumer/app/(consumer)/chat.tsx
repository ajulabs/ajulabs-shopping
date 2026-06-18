import { ChatIA } from '../../src/features/consumer/chat';
import { useDoubleBackExit } from '../../src/shared/hooks';

export default function ChatScreen() {
  useDoubleBackExit();
  return <ChatIA />;
}
