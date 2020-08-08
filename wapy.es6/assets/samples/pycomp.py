import sys
import ast
import ulogging
from micropython import function
from ubytecode import Bytecode, get_opcode_ns



import io
import usymtable
import mpylib

log = ulogging.getLogger(__name__)

opc = get_opcode_ns()


class Compiler(ast.NodeVisitor):

    def __init__(self, symtab_map, filename="<file>"):
        self.filename = filename
        self.symtab_map = symtab_map
        # Symtab for current scope
        self.symtab = None
        self.bc = None

    def stmt_list_visit(self, lst):
        for s in lst:
            log.debug("%s", ast.dump(s))
            org_stk_ptr = self.bc.stk_ptr
            self.visit(s)
            # Each complete statement should have zero cumulative stack effect
            assert self.bc.stk_ptr == org_stk_ptr, "%d vs %d" % (self.bc.stk_ptr, org_stk_ptr)

    def visit_Module(self, node):
        self.symtab = self.symtab_map[node]
        self.bc = Bytecode()
        self.stmt_list_visit(node.body)
        self.bc.add(opc.LOAD_CONST_NONE)
        self.bc.add(opc.RETURN_VALUE)

    def visit_Import(self, node):
        for n in node.names:
            self.bc.load_int(0)
            self.bc.add(opc.LOAD_CONST_NONE)
            self.bc.add(opc.IMPORT_NAME, n.name)
            if n.asname:
                comps = n.name.split(".")
                for c in comps[1:]:
                    self.bc.add(opc.LOAD_ATTR, c)
                self._visit_var(n.asname, ast.Store())
            else:
                self._visit_var(n.name.split(".", 1)[0], ast.Store())

    def visit_Assign(self, node):
        self.visit(node.value)
        for t in node.targets[:-1]:
            self.bc.add(opc.DUP_TOP)
            self.visit(t)
        self.visit(node.targets[-1])

    def visit_Expr(self, node):
        self.visit(node.value)
        self.bc.add(opc.POP_TOP)

    def visit_Call(self, node):
        assert not node.keywords
        self.visit(node.func)
        for arg in node.args:
            self.visit(arg)
        self.bc.add(opc.CALL_FUNCTION, len(node.args), 0)

    def visit_BinOp(self, node):
        binop_map = {
            ast.Add: opc.BINARY_ADD,
            ast.Sub: opc.BINARY_SUBTRACT,
            ast.Mult: opc.BINARY_MULTIPLY,
            ast.MatMult: opc.BINARY_MAT_MULTIPLY,
            ast.Div: opc.BINARY_TRUE_DIVIDE,
            ast.FloorDiv: opc.BINARY_FLOOR_DIVIDE,
            ast.Mod: opc.BINARY_MODULO,
            ast.Pow: opc.BINARY_POWER,
            ast.LShift: opc.BINARY_LSHIFT,
            ast.RShift: opc.BINARY_RSHIFT,
            ast.BitAnd: opc.BINARY_AND,
            ast.BitOr: opc.BINARY_OR,
            ast.BitXor: opc.BINARY_XOR,
        }
        self.visit(node.left)
        self.visit(node.right)
        self.bc.add(binop_map[type(node.op)])

    def visit_UnaryOp(self, node):
        unop_map = {
            ast.UAdd: opc.UNARY_POSITIVE,
            ast.USub: opc.UNARY_NEGATIVE,
            ast.Invert: opc.UNARY_INVERT,
            ast.Not: opc.UNARY_NOT,
        }
        self.visit(node.operand)
        self.bc.add(unop_map[type(node.op)])

    def visit_Name(self, node):
        self._visit_var(node.id, node.ctx)

    def _visit_var(self, var, ctx):
        scope = self.symtab.get_scope(var)
        if isinstance(ctx, ast.Load):
            op = [opc.LOAD_NAME, opc.LOAD_GLOBAL, opc.LOAD_FAST_N, opc.LOAD_DEREF][scope]
        elif isinstance(ctx, ast.Store):
            op = [opc.STORE_NAME, opc.STORE_GLOBAL, opc.STORE_FAST_N, opc.STORE_DEREF][scope]
        else:
            assert 0

        if scope in (usymtable.SCOPE_FAST, usymtable.SCOPE_DEREF):
            id = self.symtab.get_fast_local(var)
            self.bc.add(op, id)
        else:
            self.bc.add(op, var)

    def visit_Num(self, node):
        assert isinstance(node.n, int)
        assert -2**30 < node.n < 2**30 - 1
        self.bc.load_int(node.n)

    def visit_Str(self, node):
        self.bc.add(opc.LOAD_CONST_OBJ, node.s)

    def visit_Bytes(self, node):
        self.bc.add(opc.LOAD_CONST_OBJ, node.s)


def compile_ast(tree, filename="<file>"):
    symtable_b = usymtable.SymbolTableBuilder()
    symtable_b.visit(tree)

    compiler = Compiler(symtable_b.symtab_map, filename)
    compiler.visit(tree)

    co = compiler.bc.get_codeobj()
    co.co_name = "<module>"
    co.co_filename = compiler.filename
    return co



import dis
import opcode
opcode.config.MICROPY_OPT_CACHE_MAP_LOOKUP_IN_BYTECODE = 1
#ulogging.basicConfig(level=ulogging.DEBUG)


if __name__ == "__main__":
    t = ast.parse(open(sys.argv[1]).read())
    #print(ast.dump(t))

    co = compile_ast(t)

    #print(co.co_code)
    dis.dis(co, real_qstrs=True)

    #print(co.get_const_table())
    f = function(co.get_code(), co.get_const_table(), globals())

    print("Running code:", f)
    f()
