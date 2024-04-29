
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

type Partial<T> = {
  [P in keyof T]?: T[P];
};


interface ConstrainDOMStringParameters {
  exact?: string | string[];
  ideal?: string | string[];
}

