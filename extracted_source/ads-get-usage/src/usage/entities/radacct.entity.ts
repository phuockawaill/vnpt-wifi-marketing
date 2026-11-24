import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'radacct' })
export class RadAcct {
  @PrimaryGeneratedColumn()
  radacctid: number;

  @Column()
  username: string;

  @Column()
  nasipaddress: string;

  @Column('datetime')
  acctstarttime: Date;

  @Column()
  acctstoptime: Date;

  @Column()
  acctsessiontime: number;

  @Column()
  acctinputoctets: number;

  @Column()
  acctoutputoctets: number;

  @Column()
  callingstationid: string;

  @Column()
  framedipaddress: string;

  @Column()
  acctterminatecause: string;
}
