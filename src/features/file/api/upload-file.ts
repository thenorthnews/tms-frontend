import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export type UploadFileResponse = {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
};

export const uploadFile = async ({
  file,
}: {
  file: File;
}): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return (response as unknown as UploadFileResponse[])[0];
};

type UseUploadFileOptions = {
  mutationConfig?: MutationConfig<typeof uploadFile>;
};

export const useUploadFile = ({
  mutationConfig,
}: UseUploadFileOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    mutationFn: uploadFile,
  });
};
