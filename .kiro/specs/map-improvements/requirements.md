# Requirements Document

## Introduction

Dokumen ini menjelaskan requirements untuk peningkatan Map Dashboard - memperbaiki tampilan device node agar lebih fokus pada icon, deskripsi lebih simpel, dan meningkatkan kemampuan kustomisasi layout untuk membuat visualisasi network yang lebih baik dengan sekat per ruangan dan per lane.

## Glossary

- **System**: Aplikasi MikroTik Netwatch Visual Dashboard
- **Device Node**: Node yang merepresentasikan device network (Router, Tablet, Scanner, Smart TV)
- **Layout Element**: Elemen visual untuk mengorganisir map (Lane, Room, Divider, Label)
- **Map**: Halaman visualisasi network dengan drag-and-drop interface
- **Icon Size**: Ukuran icon device pada map
- **Layout Tools**: Tools untuk menambah dan mengedit layout elements
- **Lane**: Sekat untuk mengelompokkan device dalam satu jalur/area kerja
- **Room**: Sekat untuk mengelompokkan device dalam satu ruangan

## Requirements

### Requirement 1: Device Node Visual Simplification ✅ COMPLETED

**User Story:** Sebagai user, saya ingin device node lebih fokus pada icon router dengan ukuran yang lebih besar, dan deskripsi yang lebih simpel, sehingga map lebih mudah dibaca dan tidak terlalu ramai.

#### Acceptance Criteria

1. ✅ THE System SHALL menampilkan device icon dengan ukuran 8x8 (32px) - lebih besar dari sebelumnya (3.5x3.5)
2. ✅ THE System SHALL menghilangkan kotak besar di sekitar icon
3. ✅ THE System SHALL hanya menampilkan nama device sebagai deskripsi (tanpa lane name dan status text)
4. ✅ THE System SHALL menggunakan border color untuk menunjukkan status (hijau=UP, merah=DOWN)
5. ✅ THE System SHALL menggunakan animasi pulse untuk device yang DOWN
6. ✅ THE System SHALL menjaga spacing yang baik antara icon dan text
7. ✅ WHEN user hover pada device node, THE System SHALL menampilkan efek scale dan shadow
8. ✅ THE System SHALL memastikan semua device type (Router, Tablet, Scanner, Smart TV) terlihat proporsional
9. ✅ THE System SHALL menggunakan backdrop-blur untuk efek modern pada node

### Requirement 2: Layout Element - Lane Support ✅ COMPLETED

**User Story:** Sebagai operator, saya ingin bisa membuat sekat per lane untuk mengelompokkan device berdasarkan jalur kerja, sehingga visualisasi lebih terorganisir.

#### Acceptance Criteria

1. ✅ THE System SHALL menyediakan button "Lane" di Layout Tools
2. ✅ WHEN Lane button diklik, THE System SHALL membuat lane element dengan ukuran default 250x180px
3. ✅ THE System SHALL menampilkan lane dengan border dashed (garis putus-putus) berwarna biru
4. ✅ THE System SHALL menampilkan label "Lane" di tengah element
5. ✅ THE System SHALL menggunakan opacity 0.15 untuk background lane agar tidak menutupi device
6. ✅ THE System SHALL memungkinkan user resize lane dengan drag handle
7. ✅ THE System SHALL memungkinkan user drag lane ke posisi yang diinginkan
8. ✅ THE System SHALL menyimpan posisi dan ukuran lane ke database

### Requirement 3: Layout Element - Room Support ✅ COMPLETED

**User Story:** Sebagai operator, saya ingin bisa membuat sekat per ruangan untuk mengelompokkan device berdasarkan lokasi fisik, sehingga map mencerminkan layout ruangan sebenarnya.

#### Acceptance Criteria

1. ✅ THE System SHALL menyediakan button "Room" di Layout Tools
2. ✅ WHEN Room button diklik, THE System SHALL membuat room element dengan ukuran default 350x250px
3. ✅ THE System SHALL menampilkan room dengan border solid (garis penuh) berwarna orange dengan ketebalan 4px
4. ✅ THE System SHALL menampilkan label "Room" di tengah element dengan font lebih besar
5. ✅ THE System SHALL menggunakan opacity 0.25 untuk background room
6. ✅ THE System SHALL menampilkan shadow untuk memberikan efek depth
7. ✅ THE System SHALL memungkinkan user resize room dengan drag handle
8. ✅ THE System SHALL memungkinkan user drag room ke posisi yang diinginkan
9. ✅ THE System SHALL menyimpan posisi dan ukuran room ke database

### Requirement 4: Layout Element - Divider Support ✅ COMPLETED

**User Story:** Sebagai operator, saya ingin bisa membuat garis pembatas untuk memisahkan area yang berbeda, sehingga map lebih terstruktur.

#### Acceptance Criteria

1. ✅ THE System SHALL menyediakan button "Divider" di Layout Tools
2. ✅ WHEN Divider button diklik, THE System SHALL membuat divider element dengan ukuran default 400x4px
3. ✅ THE System SHALL menampilkan divider sebagai garis horizontal berwarna gray
4. ✅ THE System SHALL tidak menampilkan label pada divider (label kosong)
5. ✅ THE System SHALL menggunakan opacity 1 (full opacity) untuk divider
6. ✅ THE System SHALL memungkinkan user resize divider (minimal width 200px)
7. ✅ THE System SHALL memungkinkan user drag divider ke posisi yang diinginkan

### Requirement 5: Layout Element - Label Support ✅ COMPLETED

**User Story:** Sebagai operator, saya ingin bisa menambahkan label text untuk memberi keterangan pada area tertentu, sehingga map lebih informatif.

#### Acceptance Criteria

1. ✅ THE System SHALL menyediakan button "Label" di Layout Tools
2. ✅ WHEN Label button diklik, THE System SHALL membuat label element dengan ukuran default 150x40px
3. ✅ THE System SHALL menampilkan label dengan text "Label" dan font size xl
4. ✅ THE System SHALL tidak menampilkan background atau border pada label
5. ✅ THE System SHALL menggunakan warna dark gray untuk text
6. ✅ THE System SHALL memungkinkan user drag label ke posisi yang diinginkan
7. ✅ THE System SHALL menyimpan posisi label ke database

### Requirement 6: Layout Tools UI Improvements ✅ COMPLETED

**User Story:** Sebagai operator, saya ingin layout tools mudah diakses dan digunakan, sehingga saya bisa membuat layout dengan cepat.

#### Acceptance Criteria

1. ✅ THE System SHALL menampilkan Layout Tools button di top-center panel
2. ✅ WHEN Layout Tools button diklik, THE System SHALL menampilkan 4 tool buttons (Lane, Room, Divider, Label)
3. ✅ THE System SHALL menampilkan icon yang sesuai untuk setiap tool (Square, Box, Minus, Type)
4. ✅ THE System SHALL menggunakan color coding untuk setiap tool (blue=Lane, yellow=Room, gray=Divider/Label)
5. ✅ THE System SHALL menampilkan label text di bawah icon
6. ✅ THE System SHALL menampilkan tooltip saat hover pada tool button
7. ✅ THE System SHALL hanya menampilkan Layout Tools untuk ADMIN dan OPERATOR (tidak untuk VIEWER)

### Requirement 7: Layout Element Deletion ✅ COMPLETED

**User Story:** Sebagai operator, saya ingin bisa menghapus layout element yang tidak diperlukan, sehingga saya bisa menjaga map tetap bersih.

#### Acceptance Criteria

1. ✅ WHEN user select layout element dan tekan Delete key, THE System SHALL menghapus element
2. ✅ THE System SHALL menghapus element dari database
3. ✅ THE System SHALL menghapus element dari map secara real-time
4. ✅ THE System SHALL hanya mengizinkan ADMIN dan OPERATOR untuk menghapus layout elements
5. ✅ THE System SHALL tidak mengizinkan delete device nodes dengan Delete key (hanya layout elements)

### Requirement 8: Visual Consistency and Modern Design ✅ COMPLETED

**User Story:** Sebagai user, saya ingin map memiliki tampilan yang modern dan konsisten, sehingga nyaman untuk digunakan.

#### Acceptance Criteria

1. ✅ THE System SHALL menggunakan backdrop-blur effect untuk device nodes
2. ✅ THE System SHALL menggunakan rounded corners untuk semua elements
3. ✅ THE System SHALL menggunakan shadow untuk memberikan depth
4. ✅ THE System SHALL menggunakan smooth transitions untuk semua interactions
5. ✅ THE System SHALL menggunakan color scheme yang konsisten (blue=Lane, orange=Room, gray=Divider/Label)
6. ✅ THE System SHALL menampilkan label dengan background putih semi-transparent dan border subtle

### Requirement 2: Layout Element Editing

**User Story:** Sebagai operator, saya ingin bisa mengedit layout elements yang sudah dibuat, sehingga saya bisa menyesuaikan label, warna, dan ukuran sesuai kebutuhan.

#### Acceptance Criteria

1. WHEN user click pada layout element, THE System SHALL menampilkan edit dialog
2. THE System SHALL memungkinkan user mengedit label text dari layout element
3. THE System SHALL memungkinkan user mengubah warna layout element
4. THE System SHALL menyediakan color picker untuk memilih warna
5. WHEN user menyimpan perubahan, THE System SHALL update layout element di database
6. WHEN user membatalkan edit, THE System SHALL menutup dialog tanpa menyimpan perubahan
7. THE System SHALL menampilkan perubahan secara real-time setelah save
8. THE System SHALL hanya mengizinkan ADMIN dan OPERATOR untuk mengedit layout elements
9. WHEN VIEWER mengakses map, THE System SHALL tidak menampilkan tombol edit

### Requirement 3: Layout Element Label Customization

**User Story:** Sebagai operator, saya ingin bisa mengubah label layout element dengan mudah, sehingga saya bisa memberi nama yang sesuai untuk setiap area.

#### Acceptance Criteria

1. WHEN user mengedit layout element, THE System SHALL menampilkan input field untuk label
2. THE System SHALL memvalidasi bahwa label tidak kosong untuk LANE dan ROOM
3. THE System SHALL mengizinkan label kosong untuk DIVIDER
4. WHEN label diubah, THE System SHALL menampilkan label baru di map
5. THE System SHALL menyimpan label ke database
6. THE System SHALL menampilkan label dengan font size yang sesuai dengan ukuran element

### Requirement 4: Layout Element Color Customization

**User Story:** Sebagai operator, saya ingin bisa mengubah warna layout element, sehingga saya bisa membedakan area yang berbeda dengan warna yang berbeda.

#### Acceptance Criteria

1. WHEN user mengedit layout element, THE System SHALL menampilkan color picker
2. THE System SHALL menyediakan preset colors yang umum digunakan
3. THE System SHALL memungkinkan user memilih custom color dengan hex code
4. WHEN warna diubah, THE System SHALL menampilkan warna baru di map
5. THE System SHALL menyimpan warna ke database
6. THE System SHALL memastikan warna yang dipilih kontras dengan text label

### Requirement 5: Layout Element Size Adjustment

**User Story:** Sebagai operator, saya ingin bisa mengubah ukuran layout element dengan lebih presisi, sehingga saya bisa menyesuaikan dengan area yang sebenarnya.

#### Acceptance Criteria

1. WHEN user mengedit layout element, THE System SHALL menampilkan input fields untuk width dan height
2. THE System SHALL memvalidasi bahwa width minimal 50px dan height minimal 30px
3. THE System SHALL memvalidasi bahwa width maksimal 2000px dan height maksimal 2000px
4. WHEN ukuran diubah, THE System SHALL update ukuran element di map
5. THE System SHALL menyimpan ukuran ke database
6. THE System SHALL tetap memungkinkan resize dengan drag handle (existing feature)

### Requirement 6: Layout Element Quick Actions

**User Story:** Sebagai operator, saya ingin bisa mengakses edit dan delete actions dengan cepat, sehingga saya tidak perlu banyak klik untuk mengelola layout.

#### Acceptance Criteria

1. WHEN user click pada layout element, THE System SHALL menampilkan action buttons
2. THE System SHALL menampilkan Edit button untuk membuka edit dialog
3. THE System SHALL menampilkan Delete button untuk menghapus element
4. WHEN Delete button diklik, THE System SHALL menampilkan konfirmasi dialog
5. WHEN user konfirmasi delete, THE System SHALL menghapus element dari database dan map
6. THE System SHALL menutup action buttons ketika user click di luar element
7. THE System SHALL hanya menampilkan action buttons untuk ADMIN dan OPERATOR

### Requirement 7: Layout Element Type-Specific Settings

**User Story:** Sebagai operator, saya ingin setiap type layout element memiliki pengaturan yang sesuai dengan fungsinya, sehingga saya bisa mengoptimalkan visualisasi.

#### Acceptance Criteria

1. WHEN editing LANE, THE System SHALL menampilkan border style options (solid, dashed, dotted)
2. WHEN editing ROOM, THE System SHALL menampilkan border width options (thin, medium, thick)
3. WHEN editing DIVIDER, THE System SHALL menampilkan thickness options (2px, 4px, 6px, 8px)
4. WHEN editing LABEL, THE System SHALL menampilkan font size options (small, medium, large, x-large)
5. THE System SHALL menyimpan type-specific settings ke database
6. THE System SHALL menerapkan settings ke visual element di map

### Requirement 8: Improved Layout Tools UI

**User Story:** Sebagai operator, saya ingin layout tools lebih mudah diakses dan digunakan, sehingga saya bisa membuat layout dengan cepat.

#### Acceptance Criteria

1. THE System SHALL menampilkan layout tools panel yang selalu visible (tidak perlu toggle)
2. THE System SHALL menampilkan preview icon untuk setiap layout type
3. WHEN user hover pada tool button, THE System SHALL menampilkan tooltip dengan deskripsi
4. THE System SHALL menampilkan shortcut keyboard untuk menambah layout elements
5. THE System SHALL mengelompokkan tools berdasarkan kategori (Structure, Decoration)
6. THE System SHALL menampilkan recently used layout types di bagian atas

### Requirement 9: Layout Element Duplication

**User Story:** Sebagai operator, saya ingin bisa menduplikasi layout element yang sudah ada, sehingga saya tidak perlu membuat ulang element yang sama.

#### Acceptance Criteria

1. WHEN user click pada layout element, THE System SHALL menampilkan Duplicate button
2. WHEN Duplicate button diklik, THE System SHALL membuat copy dari element
3. THE System SHALL menempatkan duplicate element dengan offset 20px dari original
4. THE System SHALL menyimpan duplicate element ke database
5. THE System SHALL memberikan label baru dengan suffix "Copy" pada duplicate element
6. THE System SHALL mempertahankan semua properties (color, size, type) dari original

### Requirement 10: Layout Element Z-Index Management

**User Story:** Sebagai operator, saya ingin bisa mengatur layer order dari layout elements, sehingga saya bisa mengontrol element mana yang tampil di depan atau belakang.

#### Acceptance Criteria

1. WHEN user click pada layout element, THE System SHALL menampilkan layer control buttons
2. THE System SHALL menampilkan "Bring to Front" button
3. THE System SHALL menampilkan "Send to Back" button
4. WHEN "Bring to Front" diklik, THE System SHALL mengubah z-index element ke nilai tertinggi
5. WHEN "Send to Back" diklik, THE System SHALL mengubah z-index element ke nilai terendah
6. THE System SHALL menyimpan z-index ke database
7. THE System SHALL memastikan device nodes selalu tampil di atas layout elements

### Requirement 11: Error Handling and Validation

**User Story:** Sebagai user, saya ingin mendapat feedback yang jelas ketika terjadi error atau validasi gagal, sehingga saya tahu apa yang harus diperbaiki.

#### Acceptance Criteria

1. WHEN validasi gagal, THE System SHALL menampilkan error message yang spesifik
2. WHEN save gagal, THE System SHALL menampilkan error message dan tidak menutup dialog
3. WHEN delete gagal, THE System SHALL menampilkan error message
4. THE System SHALL menampilkan loading indicator saat menyimpan perubahan
5. THE System SHALL menampilkan success message setelah perubahan berhasil disimpan
6. THE System SHALL menampilkan error message dengan styling merah
7. THE System SHALL menampilkan success message dengan styling hijau

### Requirement 12: Performance Optimization

**User Story:** Sebagai user, saya ingin map tetap responsive meskipun ada banyak layout elements, sehingga saya bisa bekerja dengan lancar.

#### Acceptance Criteria

1. THE System SHALL me-render layout elements secara efisien
2. THE System SHALL menggunakan React memo untuk mencegah unnecessary re-renders
3. THE System SHALL menggunakan debounce untuk update position saat drag
4. THE System SHALL menggunakan optimistic updates untuk perubahan visual
5. THE System SHALL memuat layout elements secara lazy jika jumlahnya banyak
6. THE System SHALL menjaga frame rate minimal 30fps saat drag and drop

