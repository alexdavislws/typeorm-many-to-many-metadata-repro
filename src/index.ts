import 'reflect-metadata';
import { Entity, ManyToMany, JoinTable, ManyToOne, OneToMany, JoinColumn, DataSource, Column, PrimaryColumn } from 'typeorm';

@Entity('parent_one')
export class ParentOne {
  @PrimaryColumn({ type: 'int', name: 'id', unsigned: true })
  public id!: number;

  @Column({ type: 'int', name: 'test_column', unsigned: true })
  public testColumn!: number;

  @OneToMany((type) => ParentOneHasParentTwos, (parentOneHasParentTwos) => parentOneHasParentTwos.parentOne)
  public parentOneHasParentTwos!: ParentOneHasParentTwos[]

  @ManyToMany((type) => ParentTwo)
  @JoinTable({
    name: 'parent_one_has_parent_twos',
    joinColumn: {
      name: 'parent_one_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'parent_two_id',
      referencedColumnName: 'id',
    },
  })
  public parentTwos!: ParentTwo[];
}

@Entity('parent_two')
export class ParentTwo {
  @PrimaryColumn({ type: 'int', name: 'id', unsigned: true })
  public id!: number;

  @OneToMany((type) => ParentOneHasParentTwos, (parentOneHasParentTwos) => parentOneHasParentTwos.parentOne)
  public parentOneHasParentTwos!: ParentOneHasParentTwos[]

  @ManyToMany((type) => ParentOne)
  @JoinTable({
    name: 'parent_one_has_parent_twos',
    joinColumn: {
      name: 'parent_two_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'parent_one_id',
      referencedColumnName: 'id',
    },
  })
  public parentOnes!: ParentOne[];
}

@Entity('parent_one_has_parent_twos')
export class ParentOneHasParentTwos {
  @PrimaryColumn({ type: 'int', name: 'id', unsigned: true })
  public id!: number;

  @Column({ type: 'int', name: 'parent_one_id', unsigned: true })
  public parentOneId!: number;

  @Column({ type: 'int', name: 'parent_two_id', unsigned: true })
  public parentTwoId!: number;

  @ManyToOne(
    () => ParentOne,
    (parentOne) => parentOne.parentOneHasParentTwos,
    { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
  )
  @JoinColumn([{ name: 'parent_one_id', referencedColumnName: 'id' }])
  public parentOne!: ParentOne;

  @ManyToOne(
    () => ParentTwo,
    (parentTwo) => parentTwo.parentOneHasParentTwos,
    { onDelete: 'CASCADE', onUpdate: 'RESTRICT' },
  )
  @JoinColumn([{ name: 'parent_two_id', referencedColumnName: 'id' }])
  public parentTwo!: ParentTwo;
}


const run = async () => {
  const con = new DataSource({
    type: 'sqlite',
    database: './db.sql',
    entities: [
      ParentOne,
      ParentTwo,
      ParentOneHasParentTwos,
    ],
    synchronize: true,
    dropSchema: true,
  });

  await con.initialize();

  // This outputs the correct column metadata for propertyName
  // [ 'id', 'parentOneId', 'parentTwoId' ]
  console.log(con.getRepository(ParentOneHasParentTwos).metadata.columns.map((c) => c.propertyName));

  // When referencing by table name, this does not output the correct column metadata for propertyName.
  // This is the use case I have that needs to work. It used to work in TypeORM 0.2.x
  // [ 'parent_two_id', 'parent_one_id' ]
  console.log(con.getRepository('parent_one_has_parent_twos').metadata.columns.map((c) => c.propertyName));

  // When referencing by table name this outputs the correct column metadata for propertyName (is not a junction table)
  // [ 'id', 'testColumn' ]
  console.log(con.getRepository('parent_one').metadata.columns.map((c) => c.propertyName));

  // My workaround - this works for what I need to output the correct entity metadata.
  // [ 'id', 'parentOneId', 'parentTwoId' ]
  const metadata = con.entityMetadatas.find((e) => e.tableName === 'parent_one_has_parent_twos');
  console.log(metadata?.columns.map((c) => c.propertyName));
};

run();