interface HttpLikeError {
  status?: number;
  message?: string;
}

function getStatus(error: unknown) {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const statusValue = (error as HttpLikeError).status;
    if (typeof statusValue === 'number') {
      return statusValue;
    }
  }

  return undefined;
}

export function isNetworkRequestError(error: unknown) {
  if (getStatus(error) !== undefined) {
    return false;
  }

  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    return normalizedMessage.includes('failed to fetch') || normalizedMessage.includes('networkerror');
  }

  return false;
}

export function getRequestErrorMessage(error: unknown, fallbackMessage: string) {
  const status = getStatus(error);

  switch (status) {
    case 401:
      return 'Sua sessao expirou. Faca login novamente para continuar.';
    case 403:
      return 'Voce nao possui permissao para visualizar este conteudo.';
    case 404:
      return 'O recurso solicitado nao foi encontrado.';
    case 409:
      return 'Conflito de dados identificado. Revise os campos e tente novamente.';
    case 422:
      return 'Existem dados invalidos no formulario. Revise os campos e tente novamente.';
    case 429:
      return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.';
    default:
      break;
  }

  if (isNetworkRequestError(error)) {
    return 'Nao foi possivel conectar com a API. Verifique se o back-end esta ativo e tente novamente.';
  }

  if (error instanceof Error && error.message && !error.message.startsWith('HTTP ')) {
    return error.message;
  }

  return fallbackMessage;
}
