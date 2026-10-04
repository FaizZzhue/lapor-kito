export interface Kecamatan {
  id: string
  code: string
  name: string
  postal_codes: string[] | null
  created_at: string
}

export interface Kelurahan {
  id: string
  kecamatan_id: string
  code: string
  name: string
  postal_code: string | null
  created_at: string
}

export interface LocationWithKecamatan extends Kelurahan {
  kecamatan?: Kecamatan
}
