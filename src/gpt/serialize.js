function serializeNode(node) {
  const serializedChildren = node.childNodes && Array.from(node.childNodes).map(serializeNode);
  
  return {
    type: node.nodeType,
    tagName: node.tagName,
    attributes: node.attributes ? Array.from(node.attributes).reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {}) : null,
    textContent: node.textContent,
    children: serializedChildren,
  };
}

export function serialize(virtualContainer) {
  return serializeNode(virtualContainer);
}
