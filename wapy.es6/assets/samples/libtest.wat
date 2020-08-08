(module
  (type (;0;) (func))
  (type (;1;) (func (result i32)))
  (type (;2;) (func (param i32)))
  (type (;3;) (func (param i32) (result i32)))
  (type (;4;) (func (param i32 i32) (result i32)))
  (import "env" "printf" (func (;0;) (type 4)))
  (import "env" "stackSave" (func (;1;) (type 1)))
  (import "env" "stackRestore" (func (;2;) (type 2)))
  (import "env" "fp$init_test$v" (func (;3;) (type 1)))
  (import "env" "__memory_base" (global (;0;) i32))
  (import "env" "__table_base" (global (;1;) i32))
  (import "env" "memory" (memory (;0;) 0))
  (import "env" "table" (table (;0;) 0 funcref))
  (func (;4;) (type 0)
    call 5)
  (func (;5;) (type 0))
  (func (;6;) (type 0)
    (local i32 i32 i32 i32 i32 i32 i32 i32 i32)
    call 1
    local.set 0
    i32.const 16
    local.set 1
    local.get 0
    local.get 1
    i32.sub
    local.set 2
    local.get 2
    call 2
    global.get 2
    local.set 3
    local.get 2
    local.get 3
    i32.store
    i32.const 0
    local.set 4
    global.get 0
    local.set 5
    local.get 5
    local.get 4
    i32.add
    local.set 6
    local.get 6
    local.get 2
    call 0
    drop
    i32.const 16
    local.set 7
    local.get 2
    local.get 7
    i32.add
    local.set 8
    local.get 8
    call 2
    return)
  (func (;7;) (type 3) (param i32) (result i32)
    (local i32 i32 i32 i32 i32 i32)
    call 1
    local.set 1
    i32.const 16
    local.set 2
    local.get 1
    local.get 2
    i32.sub
    local.set 3
    local.get 3
    local.get 0
    i32.store offset=12
    local.get 3
    i32.load offset=12
    local.set 4
    i32.const 1
    local.set 5
    local.get 4
    local.get 5
    i32.add
    local.set 6
    local.get 6
    return)
  (func (;8;) (type 0)
    call 9
    call 4)
  (func (;9;) (type 0)
    call 3
    global.set 2)
  (global (;2;) (mut i32) (i32.const 0))
  (global (;3;) i32 (i32.const 0))
  (export "__wasm_apply_relocs" (func 5))
  (export "init_test" (func 6))
  (export "init_plus_one" (func 7))
  (export "__dso_handle" (global 3))
  (export "__post_instantiate" (func 8))
  (data (;0;) (global.get 0) "hello from ffi wasm library: %p\0a\00"))
