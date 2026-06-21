import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface EnderecoAutofill {
  rua: string;
  bairro: string;
  cidade: string;
  cep?: string;
}

/**
 * Busca um endereço no ViaCEP. Retorna `null` quando o CEP não é válido
 * (menos de 8 dígitos) ou não existe (`data.erro`). Lança em falha de rede,
 * deixando o tratamento do erro a cargo de quem chama.
 */
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoAutofill | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  const data = await res.json();
  if (data.erro) return null;
  return {
    rua: data.logradouro || '',
    bairro: data.bairro || '',
    cidade: data.localidade || '',
  };
}

/**
 * Obtém as coordenadas atuais do dispositivo. No web usa a API do navegador;
 * no nativo usa expo-location (pedindo permissão). Lança o erro original
 * (com `code`/`message`) para que o chamador traduza a mensagem ao usuário.
 */
export async function obterCoordenadasAtuais(): Promise<{ latitude: number; longitude: number }> {
  if (Platform.OS === 'web') {
    if (!navigator?.geolocation) {
      throw new Error('Geolocalização não suportada.');
    }
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: false,
      }),
    );
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const err = new Error('Permita o acesso à localização.') as Error & { code?: number };
    err.code = 1;
    throw err;
  }
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
}

/**
 * Reverse-geocode via Nominatim (OpenStreetMap). Retorna os campos de endereço
 * já normalizados; strings vazias quando o provedor não os fornece.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<EnderecoAutofill> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
    { headers: { 'User-Agent': 'AjuLabsShopping/1.0' } },
  );
  const data = await res.json();
  const addr = data.address ?? {};
  return {
    rua: addr.road || addr.pedestrian || '',
    bairro: addr.suburb || addr.neighbourhood || '',
    cidade: addr.city || addr.town || '',
    cep: (addr.postcode ?? '').replace(/\D/g, '').slice(0, 8),
  };
}
