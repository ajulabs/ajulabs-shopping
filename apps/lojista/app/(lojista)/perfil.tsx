import { useAuthLojistaStore } from '../../src/features/lojista/auth/model/store';
import { PerfilLoja } from '../../src/features/lojista/perfil';
import { LogoutConfirmScreen } from '../../src/features/lojista/rbac/ui/LogoutConfirmScreen';

export default function PerfilScreen() {
  const isLojistaDono = useAuthLojistaStore((s) => s.isLojistaDono);
  const papel = useAuthLojistaStore((s) => s.papel);
  const isFuncionario = !isLojistaDono && papel === 'funcionario';

  if (isFuncionario) {
    return <LogoutConfirmScreen />;
  }

  return <PerfilLoja />;
}
