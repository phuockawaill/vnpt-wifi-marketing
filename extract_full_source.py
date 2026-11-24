# -*- coding: utf-8 -*-
"""
Script to extract complete source code and configurations directly from
the VMware VMDK disk (SERVER MARKETING-0.vmdk) without requiring VMware or VirtualBox.
"""

import os
import sys
import struct
import zlib
from functools import lru_cache
import ext4

class VMDKDisk:
    def __init__(self, path):
        print(f"[VMDK] Loading virtual disk: {path}")
        self.f = open(path, 'rb')
        self.f.seek(0, 2)
        file_size = self.f.tell()
        self.f.seek(file_size - 1024)
        h = self.f.read(512)
        magic, ver, flags, cap, grain_sz, desc_off, desc_sz, num_gtes, rgd_off, gd_off, overhead = struct.unpack('<IIIQQQQIQQQ', h[:72])
        self.grain_size = grain_sz * 512
        self.num_gtes = num_gtes
        self.capacity = cap * 512
        self.pos = 0
        num_gds = (cap // grain_sz + num_gtes - 1) // num_gtes
        self.f.seek(gd_off * 512)
        self.gd = struct.unpack(f'<{num_gds}I', self.f.read(num_gds * 4))
        print(f"[VMDK] Disk capacity: {cap * 512 / (1024**3):.1f} GB, GD entries: {len(self.gd)}")
        
    @lru_cache(maxsize=2048)
    def _get_gt(self, gt_sector):
        self.f.seek(gt_sector * 512)
        return struct.unpack(f'<{self.num_gtes}I', self.f.read(self.num_gtes * 4))
        
    @lru_cache(maxsize=16384)
    def _get_grain(self, grain_idx):
        gde_idx = grain_idx // self.num_gtes
        gte_idx = grain_idx % self.num_gtes
        gt_sector = self.gd[gde_idx]
        if gt_sector == 0:
            return b'\x00' * self.grain_size
        gt = self._get_gt(gt_sector)
        grain_sector = gt[gte_idx]
        if grain_sector == 0:
            return b'\x00' * self.grain_size
        self.f.seek(grain_sector * 512)
        lba, psize = struct.unpack('<QI', self.f.read(12))
        return zlib.decompress(self.f.read(psize))
        
    def seek(self, offset, whence=0):
        if whence == 0: self.pos = offset
        elif whence == 1: self.pos += offset
        elif whence == 2: self.pos = self.capacity + offset
        return self.pos
        
    def tell(self): return self.pos
        
    def read(self, size=-1):
        if size == -1 or self.pos + size > self.capacity: size = self.capacity - self.pos
        if size <= 0: return b''
        buf = bytearray()
        remaining = size
        while remaining > 0:
            grain_idx = self.pos // self.grain_size
            offset_in_grain = self.pos % self.grain_size
            chunk_size = min(remaining, self.grain_size - offset_in_grain)
            grain_data = self._get_grain(grain_idx)
            buf.extend(grain_data[offset_in_grain:offset_in_grain + chunk_size])
            self.pos += chunk_size
            remaining -= chunk_size
        return bytes(buf)

class PartitionView:
    def __init__(self, disk, start_bytes, size_bytes):
        self.disk = disk
        self.start = start_bytes
        self.size = size_bytes
        self.pos = 0
        
    def seek(self, offset, whence=0):
        if whence == 0: self.pos = offset
        elif whence == 1: self.pos += offset
        elif whence == 2: self.pos = self.size + offset
        return self.pos
        
    def tell(self): return self.pos
        
    def read(self, size=-1):
        if size == -1 or self.pos + size > self.size: size = self.size - self.pos
        if size <= 0: return b''
        self.disk.seek(self.start + self.pos)
        data = self.disk.read(size)
        self.pos += len(data)
        return data

    def peek(self, size):
        curr = self.pos
        data = self.read(size)
        self.pos = curr
        return data

def extract_directory_recursive(dir_inode, out_dir, skip_dirs={'node_modules', '.git', 'dist'}):
    os.makedirs(out_dir, exist_ok=True)
    count = 0
    try:
        entries = list(dir_inode.opendir())
    except Exception as e:
        print(f"Error opening dir {out_dir}: {e}")
        return 0

    for entry, ft in entries:
        name = entry.name_str
        if name in ('.', '..'):
            continue
            
        target_path = os.path.join(out_dir, name)
        
        # Check file type
        ft_name = str(ft)
        try:
            node = dir_inode.volume.inodes[entry.inode]
        except Exception as e:
            print(f"  [ERROR INODE] {entry.inode} for {name}: {e}")
            continue

        if 'DIR' in ft_name:
            if name in skip_dirs:
                print(f"  [SKIP DIR] {target_path} (dependencies/cache)")
                continue
            try:
                count += extract_directory_recursive(node, target_path, skip_dirs)
            except Exception as e:
                print(f"  [ERROR DIR] {target_path}: {e}")
        elif 'REG_FILE' in ft_name:
            try:
                f_reader = node.open()
                content = f_reader.read()
                with open(target_path, 'wb') as out_f:
                    out_f.write(content)
                count += 1
                if count % 50 == 0:
                    print(f"  [EXTRACTED] {count} files... (Latest: {name})")
            except Exception as e:
                print(f"  [ERROR FILE] {target_path}: {e}")
        elif 'SYMLINK' in ft_name:
            try:
                link_target = str(node.read_from_volume())
                # Just write link pointer text
                with open(target_path + '.symlink.txt', 'w', encoding='utf-8') as out_f:
                    out_f.write(link_target)
            except:
                pass
                pass
    return count

def extract_single_file(vol, vpath, out_file):
    try:
        inode = vol.inode_at(vpath)
        os.makedirs(os.path.dirname(out_file), exist_ok=True)
        with open(out_file, 'wb') as f:
            f.write(inode.open().read())
        print(f"[OK] Extracted config: {vpath} -> {out_file}")
        return True
    except Exception as e:
        print(f"[WARN] Could not extract {vpath}: {e}")
        return False

def main():
    vmdk_path = r'D:\OneDrive\Máy tính\WiFi\VM_\SERVER MARKETING-0.vmdk'
    out_base = r'D:\OneDrive\Máy tính\WiFi\extracted_source'
    
    print("="*70)
    print("KHỞI TẠO TIẾN TRÌNH TRÍCH XUẤT MÃ NGUỒN TỪ VMDK MARKETING SERVER")
    print("="*70)
    
    disk = VMDKDisk(vmdk_path)
    # Partition 2 starts at LBA 4096 (200GB)
    part = PartitionView(disk, 4096 * 512, 419424256 * 512)
    vol = ext4.Volume(part)
    print(f"[EXT4] Volume mounted: UUID={vol.uuid}")
    
    # 1. Extract /data/ads-production (Source code)
    print("\n--- 1. Đang trích xuất /data/ads-production (Mã nguồn chính) ---")
    ads_dir = vol.inode_at('/data/ads-production')
    ads_out = os.path.join(out_base, 'ads-production')
    c1 = extract_directory_recursive(ads_dir, ads_out)
    print(f"-> Hoàn thành trích xuất {c1} files cho ads-production.")

    # 2. Extract /data/ads-get-usage
    print("\n--- 2. Đang trích xuất /data/ads-get-usage (Module thu thập lưu lượng) ---")
    try:
        usage_dir = vol.inode_at('/data/ads-get-usage')
        usage_out = os.path.join(out_base, 'ads-get-usage')
        c2 = extract_directory_recursive(usage_dir, usage_out)
        print(f"-> Hoàn thành trích xuất {c2} files cho ads-get-usage.")
    except Exception as e:
        print(f"-> Bỏ qua ads-get-usage: {e}")

    # 3. Extract /data/cloudcmd
    print("\n--- 3. Đang trích xuất /data/cloudcmd (Quản trị tệp/CloudCMD) ---")
    try:
        cmd_dir = vol.inode_at('/data/cloudcmd')
        cmd_out = os.path.join(out_base, 'cloudcmd')
        c3 = extract_directory_recursive(cmd_dir, cmd_out)
        print(f"-> Hoàn thành trích xuất {c3} files cho cloudcmd.")
    except Exception as e:
        print(f"-> Bỏ qua cloudcmd: {e}")

    # 4. Extract Server Configs
    print("\n--- 4. Đang trích xuất các file cấu hình hệ thống /etc ---")
    cfg_out = os.path.join(out_base, 'server_configs')
    configs = [
        ('/etc/nginx/sites-available/cloud', os.path.join(cfg_out, 'nginx', 'cloud.conf')),
        ('/etc/nginx/sites-available/static', os.path.join(cfg_out, 'nginx', 'static.conf')),
        ('/etc/nginx/nginx.conf', os.path.join(cfg_out, 'nginx', 'nginx.conf')),
        ('/etc/freeradius/3.0/sites-available/default', os.path.join(cfg_out, 'freeradius', 'default.site')),
        ('/etc/freeradius/3.0/mods-available/sql', os.path.join(cfg_out, 'freeradius', 'sql.mod')),
        ('/etc/mongod.conf', os.path.join(cfg_out, 'mongodb', 'mongod.conf')),
        ('/etc/redis/redis.conf', os.path.join(cfg_out, 'redis', 'redis.conf')),
        ('/etc/elasticsearch/elasticsearch.yml', os.path.join(cfg_out, 'elasticsearch', 'elasticsearch.yml')),
        ('/etc/netplan/50-cloud-init.yaml', os.path.join(cfg_out, 'network', '50-cloud-init.yaml')),
    ]
    for vpath, out_f in configs:
        extract_single_file(vol, vpath, out_f)
        
    print("\n" + "="*70)
    print("HOÀN TẤT TRÍCH XUẤT TOÀN BỘ MÃ NGUỒN VÀ CẤU HÌNH THÀNH CÔNG!")
    print(f"Vị trí lưu trữ: {out_base}")
    print("="*70)

if __name__ == '__main__':
    main()
