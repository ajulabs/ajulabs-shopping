import { useAuthLojistaStore } from '../../store';

export function usePermissions() {
  const papel = useAuthLojistaStore((s) => s.papel);
  const isLojistaDono = useAuthLojistaStore((s) => s.isLojistaDono);

  const isAdmin = isLojistaDono || papel === 'admin';
  const isGerente = papel === 'gerente';
  const isFuncionario = papel === 'funcionario';

  return {
    papel,
    isLojistaDono,
    isAdmin,
    isGerente,
    isFuncionario,
    canViewPrices: isAdmin,
    canEditPrices: isAdmin,
    canRequestPriceChange: isFuncionario,
    canApprovePrice: isAdmin || isGerente,
    canManageUsers: isAdmin,
    canViewAuditLog: isAdmin || isGerente,
    canManageProducts: isAdmin || isGerente || isFuncionario,
    canViewVendas: isAdmin || isGerente,
    canViewStockValue: isAdmin,
  };
}
