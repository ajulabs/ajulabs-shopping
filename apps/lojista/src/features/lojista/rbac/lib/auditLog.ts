export const ACTION_LABEL: Record<string, string> = {
  product_created: 'Produto criado',
  product_edited: 'Produto editado',
  product_deleted: 'Produto excluído',
  price_change_requested: 'Solicitação de preço',
  price_change_approved: 'Preço aprovado',
  price_change_rejected: 'Preço rejeitado',
};

export const ACTION_ICON: Record<string, string> = {
  product_created: 'add-circle-outline',
  product_edited: 'create-outline',
  product_deleted: 'trash-outline',
  price_change_requested: 'pricetag-outline',
  price_change_approved: 'checkmark-circle-outline',
  price_change_rejected: 'close-circle-outline',
};

export const ACTION_COLOR: Record<string, string> = {
  product_created: '#059669',
  product_edited: '#2563EB',
  product_deleted: '#DC2626',
  price_change_requested: '#D97706',
  price_change_approved: '#059669',
  price_change_rejected: '#DC2626',
};

export const PAPEL_LABEL: Record<string, string> = {
  admin: 'Admin',
  gerente: 'Gerente',
  funcionario: 'Funcionário',
  lojista: 'Dono',
};

export function formatarData(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}
