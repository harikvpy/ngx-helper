export interface User {
  id: number;
  name: { title: string, first: string, last: string },
  gender: string;
  cell: string;
}

export const MOCK_USER: User = {
  id: 0,
  name: { title: '', first: '', last: '' },
  gender: '',
  cell: ''
}
