export interface UserData {
  passwordHash: string;
  token: string;
}

export interface Users {
  [username: string]: UserData;
}