define(
    [
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "./_base"
    ],
    function(array, declare, lang, structures) {
                
        
        structures.DoublyLinkedList = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the tail pointers (left and right)
            _tails: null,
            
            // the count of nodes and objects
            _count: 0,
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(initial) {
                
                if (lang.isArrayLike(initial)) {
                    
                    array.forEach(initial, lang.hitch(this, function(obj) {
                        
                        this.insertRight(obj);
                    }));
                }
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // the count of objects in the list
            count: function() {
                
                return this._count;
            },
            
            // get the object from the node
            getObject: function(node) {
                
                return node && node.obj;
            },
            
            // the node on the far left of the list
            left: function() {
                
                return this._tails && this._tails.left;
            },
            
            // the node on the far right of the list
            right: function() {
                
                return this._tails && this._tails.right;
            },
            
            // the next node in the list
            next: function(node) {
                
                return node && node.next;
            },
            
            // the previous node in the list
            prev: function(node) {
                
                return node && node.prev;
            },
            
            
            // add an object on the far left of the list
            insertLeft: function(obj) {
                
                if (this._tails === null) {
                    
                    return this._firstInsert(obj);
                
                }
                
                this._count += 1;
                
                this._tails.left = {
                    obj: obj,
                    prev: null,
                    next: this._tails.left
                };
                
                this._tails.left.next.prev = this._tails.left;
                
                return this._tails.left;
            },
            
            // add an object on the far right of the list
            insertRight: function(obj) {
                
                if (this._tails === null) {
                    
                    return this._firstInsert(obj);
                }
                
                this._count += 1;
                    
                this._tails.right = {
                    obj: obj,
                    prev: this._tails.right,
                    next: null
                };
                
                this._tails.right.prev.next = this._tails.right;
                
                return this._tails.right;
            },
            
            // add an object before the given node
            insertBefore: function(obj, node) {
                
                if (this._tails === null) {
                    
                    return this._firstInsert(obj);
                }
                
                node = node || null;
                
                if (node === null || node === this._tails.left) {
                    
                    return this.insertLeft(obj);
                }
                    
                this._count += 1;
                
                node.prev = {
                    obj: obj,
                    prev: node.prev,
                    next: node
                };
                
                if (node.prev.prev !== null) {
                    
                    node.prev.prev.next = node.prev;
                }
                
                return node.prev;
            },
            
            // add an object after the given node
            insertAfter: function(obj, node) {
                
                if (this._tails === null) {
                    
                    return this._firstInsert(obj);
                    
                }
                
                node = node || null;
                
                if (node === null || node === this._tails.right) {
                    
                    return this.insertRight(obj);
                }
                
                this._count += 1;
                    
                node.next = {
                    obj: obj,
                    prev: node,
                    next: node.next
                };
                
                if (node.next.next !== null) {
                    
                    node.next.next.prev = node.next;
                }
                
                return node.next;
            },
            
            // replace an object at the given node
            replace: function(obj, node) {
                
                var oldObj;
                
                node = node || null;
                
                if (node !== null) {
                    
                    oldObj = node.obj;
                    node.obj = obj;
                    return oldObj;
                }
                
                return null;
            },
            
            
            // remove an object from the far left of the list
            removeFirst: function() {
                
                var obj;
                
                if (this._tails === null) {
                    
                    return null;
                }
                
                obj = this._tails.left.obj;
                
                this._count -= 1;
                if (this._count === 0) {
                    
                    this._empty();
                    
                } else {
                    
                    this._tails.left = this._tails.left.next;
                    this._tails.left.prev = null;
                }
                
                return obj;
            },
            
            // remove an object from the far right of the list
            removeLast: function() {
                
                var obj;
                
                if (this._tails === null) {
                    
                    return null;
                }
                
                obj = this._tails.right.obj;
                
                this._count -= 1;
                if (this._count === 0) {
                    
                    this._empty();
                
                } else {
                    
                    this._tails.right = this._tails.right.prev;
                    this._tails.right.next = null;
                }
                
                return obj;
            },
            
            // remove the given node's object
            remove: function(node) {
                
                var obj;
                
                node = node || null;
                
                if (this._tails === null) {
                    
                    return null;
                }
                
                if (node !== null) {
                    
                    if (node === this._tails.left) {
                        
                        obj = this.removeFirst();
                        
                    } else if (node == this._tails.right) {
                        
                        obj = this.removeLast();
                        
                    } else {
                        
                        obj = node.obj;
                        
                        this._count -= 1;
                        if (this._count === 0) {
                            
                            this._empty();
                        
                        } else {
                        
                            if (node.prev !== null) {
                            
                                node.prev.next = node.next;
                            }
                        
                            if (node.next !== null) {
                            
                                node.next.prev = node.prev;
                            }
                        }
                    }
                
                } else {
                
                    return null;
                }
                
                return obj;
            },
            
            
            // empty the list
            empty: function() {
                
                this._empty();
                this._count = 0;
            },
            
            
            // for each iterator
            forEach: function(fn) {
                
                var node = this.left(),
                    i = 0;
                
                while (node !== null) {
                    
                    fn(node.obj, i, node);
                    node = node.next;
                    i += 1;
                }
            },
            
            // for each reverse iterator
            forEachReverse: function(fn) {
                
                var node = this.right(),
                    i = 0;
                
                while (node !== null) {
                    
                    fn(node.obj, i, node);
                    node = node.prev;
                    i += 1;
                }
            },
            
            // some iterator
            some: function(fn) {
                
                var node = this.left(),
                    val = false,
                    i = 0;
                
                while (node !== null && !val) {
                    
                    val = fn(node.obj, i, node);
                    node = node.next;
                    i += 1;
                }
            },
            
            // some reverse iterator
            someReverse: function(fn) {
                
                var node = this.right(),
                    val = false,
                    i = 0;
                
                while (node !== null && !val) {
                    
                    val = fn(node.obj, i, node);
                    node = node.prev;
                    i += 1;
                }
            },
            
            // every iterator
            every: function(fn) {
                
                var node = this.left(),
                    val = true,
                    i = 0;
                
                while (node !== null && val) {
                    
                    val = fn(node.obj, i, node);
                    node = node.next;
                    i += 1;
                }
            },
            
            // every reverse iterator
            everyReverse: function(fn) {
                
                var node = this.right(),
                    val = true,
                    i = 0;
                
                while (node !== null && val) {
                    
                    val = fn(node.obj, i, node);
                    node = node.prev;
                    i += 1;
                }
            },
            
            // map
            map: function(fn) {
                
                var node = this.left(),
                    out = [],
                    i = 0;
                
                while (node !== null) {
                    
                    out.push(fn(node.obj, i, node));
                    node = node.next;
                    i += 1;
                }
                
                return out;
            },
            
            // map reverse
            mapReverse: function(fn) {
                
                var node = this.right(),
                    out = [],
                    i = 0;
                
                while (node !== null) {
                    
                    out.push(fn(node.obj, i, node));
                    node = node.prev;
                    i += 1;
                }
                
                return out;
            },
            
            // filter
            filter: function(fn) {
                
                var node = this.left(),
                    out = [],
                    i = 0;
                
                while (node !== null) {
                    
                    if (fn(node.obj, i, node)) {
                        
                        out.push(node.obj);
                    }
                    
                    node = node.next;
                    i += 1;
                }
                
                return out;
            },
            
            // filter reverse
            filterReverse: function(fn) {
                
                var node = this.right(),
                    out = [],
                    i = 0;
                
                while (node !== null) {
                    
                    if (fn(node.obj, i, node)) {
                        
                        out.push(node.obj);
                    }
                    
                    node = node.prev;
                    i += 1;
                }
                
                return out;
            },
            
            // reduce
            reduce: function(fn, initial) {
                
                var node = this.left(),
                    out = initial,
                    i = 0;
                
                while (node !== null) {
                    
                    out = fn(node.obj, out, i, node);
                    node = node.next;
                    i += 1;
                }
                
                return out;
            },
            
            // reduce reverse
            reduceReverse: function(fn, initial) {
                
                var node = this.right(),
                    out = initial,
                    i = 0;
                
                while (node !== null) {
                    
                    out = fn(node.obj, out, i, node);
                    node = node.prev;
                    i += 1;
                }
                
                return out;
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // internal methods
            ///////////////////////////////////////////////////////////////////
            
            // the first insert
            _firstInsert: function(obj) {
                
                var node = {
                    obj: obj,
                    prev: null,
                    next: null
                };
                
                this._tails = {
                    left: node,
                    right: node
                };
                
                this._count += 1;
                
                return node;
            },
            
            // empty the list
            _empty: function() {
                
                this._tails = null;
            }
        });
        
        
        return structures.DoublyLinkedList;
    }
);